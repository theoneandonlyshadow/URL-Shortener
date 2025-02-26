# URL Shortener

This project is a comprehensive URL shortener service with advanced features.

# Note

Sensitive keys are in this codebase. They are added to streamline the deployment after encountering issues with Render. They will be revoked soon.
![Live demo](https://url-shortener-7lop.onrender.com/)

## Features

- Create, redirect, and retrieve analytics for URLs with rate limiting to prevent abuse.
- Design database schema for URL storage, user data, and analytics, with mock data for testing.
- Log each redirect event with detailed audience data (IP, user agent, OS, device type, geolocation).
- Use Redis caching to efficiently store and serve short and long URLs.
- Write integration tests for all endpoints with comprehensive error handling.
- Dockerized the application and deployed on render.com.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/urlshortener.git
    ```
2. Navigate to the project directory:
    ```sh
    cd urlshortener
    ```
3. Install dependencies:
    ```sh
    npm install
    ```

## Usage

1. Start the server:
    ```sh
    npm start
    ```
2. Open your browser and go to `http://localhost:5000`

## Deployment

The application is Dockerized and can be deployed using the following steps:

1. Build the Docker image:
    ```sh
    docker build -t urlshortener .
    ```
2. Run the Docker container:
    ```sh
    docker run -p 5000:5000 urlshortener
    ```


## Note (again):

Render does not support Docker natively, but you can deploy with a Docker-based VPS like DigitalOcean, AWS, or Railway.


## License

This project is licensed under the MIT License.
