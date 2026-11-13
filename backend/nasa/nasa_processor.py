import re
import pandas as pd

from pathlib import Path
from collections import defaultdict
from statistics import median


NASA_DATA_DIR = Path(__file__).parent.parent / "nasa_data"


# --------------------------------------------------
# 1. IDENTIFY PARTICIPANT AND SAMPLE
# --------------------------------------------------

def identify_sample(sample_id):

    if not isinstance(sample_id, str):
        return None, None

    match = re.match(
        r"^(C\d+)_serum_(.+)$",
        sample_id.strip(),
        re.IGNORECASE
    )

    if not match:
        return None, None

    participant_id = match.group(1).upper()
    sample_label = match.group(2).strip().upper()

    return participant_id, sample_label


# --------------------------------------------------
# 2. IDENTIFY SAMPLE ID COLUMN
# --------------------------------------------------

def get_sample_id_column(df):

    possible_columns = [
        "Sample Name",
        "Sample ID",
        "Sample",
        "Subject ID",
        "Participant ID"
    ]

    for column in possible_columns:

        if column in df.columns:
            return column

    for column in df.columns:

        name = column.lower()

        if "sample" in name and (
            "name" in name or "id" in name
        ):
            return column

    return None


# --------------------------------------------------
# 3. PARSE SPACEFLIGHT TIMEPOINT
# --------------------------------------------------

def parse_timepoint(sample_label):

    if not sample_label:
        return {
            "label": None,
            "phase": "unknown",
            "day": None
        }

    label = str(sample_label).strip().upper()

    # Pre-flight
    match = re.match(r"^L-(\d+)$", label)

    if match:

        return {
            "label": label,
            "phase": "pre_flight",
            "day": -int(match.group(1))
        }

    # Post-flight
    match = re.match(r"^R\+(\d+)$", label)

    if match:

        return {
            "label": label,
            "phase": "post_flight",
            "day": int(match.group(1))
        }

    # In-flight
    match = re.match(r"^FD(\d+)$", label)

    if match:

        return {
            "label": label,
            "phase": "in_flight",
            "day": int(match.group(1))
        }

    return {
        "label": label,
        "phase": "unknown",
        "day": None
    }


def timepoint_sort_key(timepoint):

    phase_order = {
        "pre_flight": 0,
        "in_flight": 1,
        "post_flight": 2,
        "unknown": 3
    }

    return (
        phase_order.get(timepoint["phase"], 3),
        timepoint["day"] if timepoint["day"] is not None else 0
    )


# --------------------------------------------------
# 4. IDENTIFY BIOMARKER MEASUREMENT COLUMNS
# --------------------------------------------------

def identify_biomarker_columns(df):

    biomarkers = {}

    for column in df.columns:

        # CMP measurements
        match = re.match(
            r"^(.+)_value_(.+)$",
            column,
            re.IGNORECASE
        )

        if match:

            biomarkers[column] = {
                "name": match.group(1),
                "unit": match.group(2),
                "measurement_type": "clinical_value",
                "interpretation": "reported_reference_range"
            }

            continue

        # Research concentrations
        match = re.match(
            r"^(.+)_concentration_(.+)$",
            column,
            re.IGNORECASE
        )

        if match:

            biomarkers[column] = {
                "name": match.group(1),
                "unit": match.group(2),
                "measurement_type": "concentration",
                "interpretation": "research_trend_only"
            }

    return biomarkers


# --------------------------------------------------
# 5. FIND CMP REFERENCE RANGES
# --------------------------------------------------

def get_reference_range(df, row, biomarker_name):

    min_column = None
    max_column = None

    for column in df.columns:

        if column.startswith(biomarker_name + "_range_min_"):
            min_column = column

        elif column.startswith(biomarker_name + "_range_max_"):
            max_column = column

    if max_column is None:

        for column in df.columns:

            if column.startswith(biomarker_name + "_max_"):
                max_column = column

    minimum = None
    maximum = None

    if min_column:

        value = pd.to_numeric(
            row[min_column],
            errors="coerce"
        )

        if pd.notna(value):
            minimum = float(value)

    if max_column:

        value = pd.to_numeric(
            row[max_column],
            errors="coerce"
        )

        if pd.notna(value):
            maximum = float(value)

    return minimum, maximum


# --------------------------------------------------
# 6. CHECK REPORTED REFERENCE RANGE
# --------------------------------------------------

def check_reference_range(value, minimum, maximum):

    if minimum is None or maximum is None:
        return "reference_range_unavailable"

    if value < minimum or value > maximum:
        return "outside_reported_reference_range"

    return "within_reported_reference_range"


# --------------------------------------------------
# 7. CALCULATE PAIRED INDIVIDUAL CHANGES
# --------------------------------------------------

def calculate_paired_changes(
    participant_measurements,
    timepoint_labels,
    measurement_type,
    unit
):

    observations = []

    # Alamar NPQ requires assay-specific validation.
    # Do not calculate percentage changes for this scale.
    allow_percentage_change = (
        "npq" not in str(unit).lower()
    )

    for label in timepoint_labels:

        individual_changes = []
        individual_percent_changes = []

        for participant_id, measurements in participant_measurements.items():

            # Each participant must have their own L-3 baseline.
            baseline_values = measurements.get("L-3", [])

            current_values = measurements.get(label, [])

            if not baseline_values or not current_values:
                continue

            # Handle multiple records at the same timepoint.
            baseline = median(baseline_values)
            current = median(current_values)

            absolute_change = current - baseline

            individual_changes.append(absolute_change)

            if (
                allow_percentage_change
                and baseline != 0
            ):

                percentage_change = (
                    absolute_change / abs(baseline)
                ) * 100

                individual_percent_changes.append(
                    percentage_change
                )

        # Summarize only participants with paired measurements.
        paired_count = len(individual_changes)

        if paired_count > 0:

            paired_median_change = median(
                individual_changes
            )

            paired_min_change = min(
                individual_changes
            )

            paired_max_change = max(
                individual_changes
            )

        else:

            paired_median_change = None
            paired_min_change = None
            paired_max_change = None

        if individual_percent_changes:

            paired_median_percent = median(
                individual_percent_changes
            )

        else:

            paired_median_percent = None

        timepoint = parse_timepoint(label)

        observations.append({

            "timepoint": label,

            "phase": timepoint["phase"],

            "day": timepoint["day"],

            "paired_participant_count": paired_count,

            "paired_median_change": (
                round(paired_median_change, 4)
                if paired_median_change is not None
                else None
            ),

            "paired_min_change": (
                round(paired_min_change, 4)
                if paired_min_change is not None
                else None
            ),

            "paired_max_change": (
                round(paired_max_change, 4)
                if paired_max_change is not None
                else None
            ),

            "paired_median_change_percent": (
                round(paired_median_percent, 2)
                if paired_median_percent is not None
                else None
            ),

            # Compatibility with existing intelligence engine.
            # This is now a paired individual-change median,
            # NOT a difference between cohort medians.
            "change_percent_vs_L3": (
                round(paired_median_percent, 2)
                if paired_median_percent is not None
                else None
            ),

            "percentage_change_interpretation": (
                "not_calculated_assay_scale_requires_validation"
                if not allow_percentage_change
                else "median_of_individual_paired_changes"
            )

        })

    return observations


# --------------------------------------------------
# 8. ANALYZE NASA DATASETS
# --------------------------------------------------

def analyze_nasa_datasets():

    if not NASA_DATA_DIR.exists():

        raise FileNotFoundError(
            f"NASA data folder not found: {NASA_DATA_DIR}"
        )

    dataset_summaries = []

    global_sample_ids = set()
    global_participants = set()

    # Cohort measurements at each timepoint.
    trend_data = defaultdict(
        lambda: defaultdict(list)
    )

    # Individual measurements for paired analysis.
    paired_data = defaultdict(
        lambda: defaultdict(
            lambda: defaultdict(list)
        )
    )

    # CMP observations outside reported ranges.
    participant_range_flags = defaultdict(
        lambda: defaultdict(list)
    )

    for file_path in NASA_DATA_DIR.glob("*.csv"):

        df = pd.read_csv(file_path)

        sample_column = get_sample_id_column(df)

        if sample_column is None:
            continue

        biomarkers = identify_biomarker_columns(df)

        dataset_name = file_path.stem

        dataset_samples = set()
        dataset_participants = set()

        # --------------------------------------------------
        # Process each biological sample
        # --------------------------------------------------

        for _, row in df.iterrows():

            if pd.isna(row[sample_column]):
                continue

            sample_id = str(row[sample_column]).strip()

            participant_id, sample_label = identify_sample(
                sample_id
            )

            if not participant_id:
                continue

            timepoint = parse_timepoint(sample_label)

            normalized_label = timepoint["label"]

            global_sample_ids.add(sample_id)
            global_participants.add(participant_id)

            dataset_samples.add(sample_id)
            dataset_participants.add(participant_id)

            # --------------------------------------------------
            # Process individual biomarkers
            # --------------------------------------------------

            for column, info in biomarkers.items():

                value = pd.to_numeric(
                    row[column],
                    errors="coerce"
                )

                if pd.isna(value):
                    continue

                value = float(value)

                biomarker_name = info["name"]

                measurement_type = info["measurement_type"]

                # Dataset + biomarker + unit + assay type.
                # This prevents mixing different assays.
                trend_key = (
                    dataset_name,
                    biomarker_name,
                    info["unit"],
                    measurement_type
                )

                # Store cohort measurements.
                trend_data[trend_key][normalized_label].append(
                    value
                )

                # Store measurements by participant.
                paired_data[trend_key][participant_id][
                    normalized_label
                ].append(value)

                # --------------------------------------------------
                # CMP reference range analysis
                # --------------------------------------------------

                if measurement_type == "clinical_value":

                    minimum, maximum = get_reference_range(
                        df,
                        row,
                        biomarker_name
                    )

                    status = check_reference_range(
                        value,
                        minimum,
                        maximum
                    )

                    if status == "outside_reported_reference_range":

                        participant_range_flags[
                            participant_id
                        ][dataset_name].append({

                            "biomarker": biomarker_name,

                            "sample": normalized_label,

                            "value": value,

                            "unit": info["unit"],

                            "reported_minimum": minimum,

                            "reported_maximum": maximum,

                            "status": status

                        })

        # --------------------------------------------------
        # Dataset summary
        # --------------------------------------------------

        dataset_summaries.append({

            "dataset": dataset_name,

            "assay_record_count": len(df),

            "unique_sample_count": len(dataset_samples),

            "participant_count": len(dataset_participants),

            "analyte_count": len(biomarkers),

            "measurement_types": sorted(
                set(
                    info["measurement_type"]
                    for info in biomarkers.values()
                )
            )

        })

    # --------------------------------------------------
    # 9. BUILD RESEARCH TRENDS
    # --------------------------------------------------

    research_trends = []

    for trend_key, timepoints in trend_data.items():

        (
            dataset_name,
            biomarker,
            unit,
            measurement_type
        ) = trend_key

        # Sort timepoints chronologically.
        ordered_labels = sorted(
            timepoints.keys(),
            key=lambda label: timepoint_sort_key(
                parse_timepoint(label)
            )
        )

        # Cohort median is retained as descriptive information.
        baseline_values = timepoints.get("L-3", [])

        cohort_baseline = (
            median(baseline_values)
            if baseline_values
            else None
        )

        observations = []

        for label in ordered_labels:

            values = timepoints[label]

            current_median = median(values)

            timepoint = parse_timepoint(label)

            # Number of unique participants at this timepoint.
            unique_participants = sum(
                1
                for measurements in paired_data[trend_key].values()
                if measurements.get(label)
            )

            observations.append({

                "timepoint": label,

                "phase": timepoint["phase"],

                "day": timepoint["day"],

                "participant_observation_count": unique_participants,

                "assay_record_count": len(values),

                "cohort_median": round(
                    current_median,
                    4
                )

            })

        # Calculate changes using each participant's own L-3.
        paired_observations = calculate_paired_changes(

            participant_measurements=paired_data[trend_key],

            timepoint_labels=ordered_labels,

            measurement_type=measurement_type,

            unit=unit

        )

        # Merge paired calculations into the timepoint observations.
        paired_lookup = {
            item["timepoint"]: item
            for item in paired_observations
        }

        for observation in observations:

            paired_result = paired_lookup.get(
                observation["timepoint"],
                {}
            )

            observation.update(paired_result)

        research_trends.append({

            "dataset": dataset_name,

            "biomarker": biomarker,

            "unit": unit,

            "measurement_type": measurement_type,

            "baseline_timepoint": (
                "L-3" if cohort_baseline is not None else None
            ),

            "cohort_baseline_median": (
                round(cohort_baseline, 4)
                if cohort_baseline is not None
                else None
            ),

            "interpretation": (
                "research_cohort_trend_only"
                if measurement_type == "concentration"
                else "reported_CMP_reference_range_available"
            ),

            "change_calculation": (
                "paired_within_participant_comparison"
            ),

            "observations": observations

        })

    # --------------------------------------------------
    # 10. BUILD PARTICIPANT RESEARCH FLAGS
    # --------------------------------------------------

    participant_summaries = []

    for participant_id, datasets in participant_range_flags.items():

        findings = []

        for dataset_name, flags in datasets.items():

            findings.extend(flags)

        participant_summaries.append({

            "participant_id": participant_id,

            "reported_range_observation_count": len(findings),

            "observations": findings

        })

    # --------------------------------------------------
    # 11. FINAL RESPONSE
    # --------------------------------------------------

    return {

        "study": "NASA OSD-575",

        "analysis_status": "success",

        "data_scope": {

            "mission": "SpaceX Inspiration4",

            "sample_type": "Blood serum",

            "purpose": "Historical spaceflight research context",

            "not_current_astronaut_data": True,

            "not_personal_baseline": True

        },

        "dataset_count": len(dataset_summaries),

        "total_assay_records": sum(
            item["assay_record_count"]
            for item in dataset_summaries
        ),

        "unique_sample_count": len(global_sample_ids),

        "participant_count": len(global_participants),

        "datasets": dataset_summaries,

        "research_trends": research_trends,

        "reported_range_observations": participant_summaries,

        "analysis_method": {

            "baseline": "Individual participant's L-3 measurement",

            "comparison": "Same participant's later measurement",

            "aggregation": "Median of individual paired changes",

            "percentage_change": (
                "Calculated individually before aggregation; "
                "not calculated for Alamar NPQ"
            ),

            "assay_matching": (
                "Dataset, biomarker, unit and measurement type "
                "must match"
            )

        },

        "interpretation_notice": (

            "NASA research measurements are historical cohort data. "

            "Paired changes compare each research participant "
            "against their own L-3 measurement. "

            "These historical measurements are not the current "
            "astronaut's personal baseline or clinical status. "

            "Research trends and reported reference-range "
            "observations must not be interpreted as diagnoses "
            "or individual health risks."

        )

    }


# --------------------------------------------------
# 12. INSPECT NASA DATASETS
# --------------------------------------------------

def inspect_nasa_datasets():

    results = []

    for file_path in NASA_DATA_DIR.glob("*.csv"):

        df = pd.read_csv(file_path)

        results.append({

            "filename": file_path.name,

            "total_rows": len(df),

            "total_columns": len(df.columns),

            "columns": df.columns.tolist(),

            "missing_values": int(
                df.isna().sum().sum()
            )

        })

    return results


# --------------------------------------------------
# 13. GET NASA DATASET SUMMARY
# --------------------------------------------------

def get_nasa_dataset_summary():

    results = []

    for file_path in NASA_DATA_DIR.glob("*.csv"):

        df = pd.read_csv(file_path)

        sample_column = get_sample_id_column(df)

        biomarkers = identify_biomarker_columns(df)

        participants = set()
        samples = set()

        if sample_column:

            for sample_id in df[sample_column].dropna():

                participant_id, _ = identify_sample(
                    str(sample_id)
                )

                if participant_id:

                    participants.add(participant_id)

                    samples.add(str(sample_id))

        results.append({

            "filename": file_path.name,

            "assay_records": len(df),

            "unique_samples": len(samples),

            "participants": len(participants),

            "biomarkers": len(biomarkers)

        })

    return results