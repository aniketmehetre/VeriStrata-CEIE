.PHONY: dev test test-v demo clean

dev:
	cd backend && uvicorn app.main:app --reload --port 8000

test:
	python -m pytest backend/tests/test_e2e.py -v

demo:
	python data/synthetic/generate_bundle.py
	python -m pytest backend/tests/test_e2e.py -v -k "clean or tampered"

clean:
	rm -rf data/originals/* data/derivatives/* tracedoc.db backend/tracedoc.db .pytest_cache

