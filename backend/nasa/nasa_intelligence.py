from collections import defaultdict

from nasa.nasa_processor import analyze_nasa_datasets


# --------------------------------------------------
# 1. IDENTIFY DATASET CATEGORY
# --------------------------------------------------

def identify_category(biomarker, dataset):

    dataset = dataset.lower()

    if "alamar" in dataset:
        return "proteomic_panel"

    if "cardiovascular" in dataset:
        return "cardiovascular_panel"

    if "immune" in dataset:
        return "immune_panel"

    if "cmp" in dataset:
        return "clinical_chemistry"

    return "general"


# --------------------------------------------------
# 2. GENERATE PAIRED RESEARCH OBSERVATIONS
# --------------------------------------------------

def generate_cohort_insights(research_trends):

    insights = []

    for trend in research_trends:

        biomarker = trend.get("biomarker", "Unknown")
        dataset = trend.get("dataset", "Unknown")
        unit = trend.get("unit", "")

        category = identify_category(
            biomarker,
            dataset
        )

        if trend.get("baseline_timepoint") != "L-3":
            continue

        for observation in trend.get("observations", []):

            if observation.get("phase") != "post_flight":
                continue

            paired_count = observation.get(
                "paired_participant_count", 0
            )

            absolute_change = observation.get(
                "paired_median_change"
            )

            percentage_change = observation.get(
                "paired_median_change_percent"
            )

            # Skip observations without valid paired data.
            if not paired_count or absolute_change is None:
                continue

            # Absolute change direction.
            if absolute_change > 0:
                absolute_direction = "increased"
            elif absolute_change < 0:
                absolute_direction = "decreased"
            else:
                absolute_direction = "unchanged"

            # Percentage change direction.
            if percentage_change is None:
                percentage_direction = None
            elif percentage_change > 0:
                percentage_direction = "increased"
            elif percentage_change < 0:
                percentage_direction = "decreased"
            else:
                percentage_direction = "unchanged"

            timepoint = observation.get(
                "timepoint", "Unknown"
            )

            # Build accurate research description.
            description = (
                f"The median absolute change in {biomarker} "
                f"was {absolute_direction} by "
                f"{abs(absolute_change)} {unit} at {timepoint}, "
                f"compared with the same participants' L-3 measurements."
            )

            if percentage_change is not None:
                description += (
                    f" The median individual percentage change "
                    f"was {percentage_direction} by "
                    f"{abs(percentage_change):.2f}%."
                )

            insights.append({

                "category": category,

                "biomarker": biomarker,

                "dataset": dataset,

                "baseline_timepoint": "L-3",

                "timepoint": timepoint,

                "phase": "post_flight",

                "cohort_median": observation.get(
                    "cohort_median"
                ),

                "unit": unit,

                "paired_participant_count": paired_count,

                "paired_median_change": absolute_change,

                "paired_min_change": observation.get(
                    "paired_min_change"
                ),

                "paired_max_change": observation.get(
                    "paired_max_change"
                ),

                "paired_median_change_percent": percentage_change,

                "direction": absolute_direction,

                "percentage_direction": percentage_direction,

                "research_observation": description,

                "clinical_interpretation": (
                    "Clinical significance is not established. "
                    "This is a descriptive observation from historical "
                    "research participants, not a current astronaut "
                    "health assessment."
                )

            })

    # Organize observations without ranking by percentage change.
    insights.sort(
        key=lambda item: (
            item["category"],
            item["biomarker"],
            item["timepoint"]
        )
    )

    return insights


# --------------------------------------------------
# 3. SUMMARIZE CMP REFERENCE RANGE OBSERVATIONS
# --------------------------------------------------

def summarize_cmp_observations(participant_data):

    summary = defaultdict(
        lambda: {
            "observation_count": 0,
            "participants": set(),
            "timepoints": set()
        }
    )

    for participant in participant_data:

        participant_id = participant.get(
            "participant_id"
        )

        for observation in participant.get(
            "observations", []
        ):

            biomarker = observation.get("biomarker")

            if not biomarker:
                continue

            summary[biomarker]["observation_count"] += 1

            if participant_id is not None:
                summary[biomarker]["participants"].add(
                    participant_id
                )

            sample = observation.get("sample")

            if sample:
                summary[biomarker]["timepoints"].add(
                    sample
                )

    results = []

    for biomarker, data in summary.items():

        results.append({

            "biomarker": biomarker,

            "outside_range_observations": (
                data["observation_count"]
            ),

            "participants_affected": len(
                data["participants"]
            ),

            "timepoints": sorted(
                data["timepoints"]
            ),

            "interpretation": (
                "Measurements outside the reference ranges "
                "reported in the source dataset. This is a "
                "historical research observation, not a diagnosis "
                "or current health-risk assessment."
            )

        })

    return sorted(
        results,
        key=lambda item: item["biomarker"]
    )


# --------------------------------------------------
# 4. SUMMARIZE RESEARCH CATEGORIES
# --------------------------------------------------

def summarize_categories(insights):

    categories = defaultdict(list)

    for item in insights:
        categories[item["category"]].append(item)

    result = {}

    for category, observations in categories.items():

        biomarkers = sorted({
            item["biomarker"]
            for item in observations
        })

        result[category] = {

            "observation_count": len(observations),

            "biomarker_count": len(biomarkers),

            "biomarkers": biomarkers

        }

    return result


# --------------------------------------------------
# 5. MAIN NASA INTELLIGENCE FUNCTION
# --------------------------------------------------

def generate_nasa_research_intelligence():

    nasa_data = analyze_nasa_datasets()

    if nasa_data.get("analysis_status") != "success":
        raise ValueError(
            "NASA dataset analysis was unsuccessful."
        )

    cohort_insights = generate_cohort_insights(
        nasa_data.get("research_trends", [])
    )

    cmp_observations = summarize_cmp_observations(
        nasa_data.get("reported_range_observations", [])
    )

    category_summary = summarize_categories(
        cohort_insights
    )

    return {

        "engine": "Aither Kairos NASA Research Intelligence",

        "status": "success",

        "source_study": nasa_data.get("study"),

        "research_context": {

            "mission": "SpaceX Inspiration4",

            "participants": nasa_data.get(
                "participant_count", 0
            ),

            "datasets_analyzed": nasa_data.get(
                "dataset_count", 0
            ),

            "assay_records_analyzed": nasa_data.get(
                "total_assay_records", 0
            ),

            "unique_samples": nasa_data.get(
                "unique_sample_count", 0
            )

        },

        "research_insights": {

            "total_observations": len(cohort_insights),

            "comparison_baseline": "L-3",

            "comparison_method": (
                "Paired participant-level comparison"
            ),

            "category_summary": category_summary,

            "cohort_trends": cohort_insights,

            "cmp_reference_range_observations": (
                cmp_observations
            )

        },

        "limitations": [

            "The source data comes from historical Inspiration4 research participants, not the current astronaut.",

            "L-3 is a historical research comparison baseline, not the current astronaut's personal baseline.",

            "Paired changes describe observations from the same participants across different timepoints.",

            "The participant count is small and does not establish statistical significance.",

            "Percentage changes are descriptive and do not represent health risk or clinical severity.",

            "Different assays and measurement units must not be treated as interchangeable.",

            "Dataset-reported reference ranges are not automatically validated astronaut-specific ranges.",

            "NASA research observations cannot independently establish current astronaut health status."

        ]

    }