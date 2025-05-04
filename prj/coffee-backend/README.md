# Coffee Shop Backend

FastAPI + SQLModel backend for the Coffee Shop project.

## Installation & Running

```bash
# 1. Enter the backend folder
cd coffee-backend

# 2. Create & activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create a `.env` file in the project root with:
#    Replace <user>, <password>, <db_name>, <your_jwt_secret> accordingly
cat > .env <<EOF
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db_name>
SECRET_KEY=<your_jwt_secret>
EOF

# 5. Initialize the database (run the SQL schema if needed)
#    Example: psql "$DATABASE_URL" -f schema.sql
psql "$DATABASE_URL" -f schema.sql

# 6. Run the development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

