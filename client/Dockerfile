FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# สร้างไฟล์ .env.local เริ่มต้น
RUN echo "NEXT_PUBLIC_API_URL=http://web:5000" > .env.local

EXPOSE 3000

CMD ["npm", "run", "dev"]
