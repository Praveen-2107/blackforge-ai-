# Frontend Dockerfile (Render-compatible)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build arg for API URL - set this in Render environment
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the app
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port (Render uses PORT env variable)
EXPOSE 3000

# Serve the built app - Render sets PORT env var
CMD serve -s build -l ${PORT:-3000}