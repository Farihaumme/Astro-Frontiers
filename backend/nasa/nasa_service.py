
import httpx
from pathlib import Path

NASA_BASE_URL = "https://osdr.nasa.gov"

NASA_DATA_DIR = Path(__file__).parent.parent / "nasa_data"
NASA_DATA_DIR.mkdir(parents=True, exist_ok=True)


# 1. Retrieve NASA study metadata
async def get_study_metadata():

    url = f"{NASA_BASE_URL}/osdr/data/osd/meta/575"

    async with httpx.AsyncClient(timeout=60) as client:

        response = await client.get(url)
        response.raise_for_status()

        return response.json()


# 2. Retrieve NASA study files
async def get_study_files():

    url = f"{NASA_BASE_URL}/osdr/data/osd/files/575"

    async with httpx.AsyncClient(timeout=60) as client:

        response = await client.get(url)
        response.raise_for_status()

        return response.json()


# 3. Download transformed NASA datasets
async def download_transformed_files():
    metadata = await get_study_files()
    study = metadata["studies"]["OSD-575"]
    files = study["study_files"]

    downloaded = []

    async with httpx.AsyncClient(
        base_url=NASA_BASE_URL,
        timeout=120,
        follow_redirects=True
    ) as client:

        for file in files:

            filename = file["file_name"]

            # Select only transformed CSV files
            if not filename.endswith("_TRANSFORMED.csv"):
                continue

            remote_url = file["remote_url"]

            response = await client.get(remote_url)
            response.raise_for_status()

            file_path = NASA_DATA_DIR / filename
            file_path.write_bytes(response.content)

            downloaded.append({
                "filename": filename,
                "path": str(file_path),
                "size": len(response.content)
            })

    return downloaded