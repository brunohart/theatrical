.PHONY: install test lint typecheck format build clean

install:
	pip install -e ".[dev]"

test:
	python -m pytest --cov=theatrical --cov-report=term-missing -v

lint:
	python -m ruff check theatrical tests

typecheck:
	python -m mypy theatrical

format:
	python -m ruff format theatrical tests

build:
	python -m build

clean:
	rm -rf dist/ build/ *.egg-info .mypy_cache .pytest_cache .ruff_cache htmlcov coverage.xml .coverage

check: typecheck lint test
