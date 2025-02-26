# Use the latest Node.js image
FROM node:latest

# Set the working directory inside the container
WORKDIR /app

# Copy all files from the current directory to the container
COPY . .

# Install dependencies
RUN npm install --force

# Expose the port the app runs on (optional, usually 3000 for Next.js, Express, etc.)
EXPOSE 3000

# Run the development server
CMD ["npm", "run", "dev"]
