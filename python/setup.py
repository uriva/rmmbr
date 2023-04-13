from setuptools import setup, find_packages

setup(
    name="rmmbr",
    version="0.0.1",
    description="Simple persistent caching.",
    url="https://github.com/uriva/rmmbr",
    packages=find_packages(),
    install_requires=[
        "redis>=3.5.3",
        "python-dotenv>=0.17.1",
        "pytest",
        "httpx",
        "aiofiles",
        "pytest-asyncio",
    ],
    entry_points={"console_scripts": ["cache=cache.cli:main"]},
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
