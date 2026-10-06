# Use Node.js 22 as the base image
FROM node:22.18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Start server
ENV NODE_ENV=production
CMD npm run start
