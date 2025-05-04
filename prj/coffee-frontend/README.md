# Coffee Shop Frontend

Next.js + React frontend for the Coffee Shop project.

## Installation & Running

```bash
# 1. Enter the frontend folder
cd coffee-frontend

# 2. Install dependencies
npm install

# 3. Create a `.env.local` file in the project root with:
#    Replace the URL if your backend is hosted elsewhere
cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

# 4. Run the development server
npm run dev

# 5. (Optional) Build and start for production
npm run build
npm start
