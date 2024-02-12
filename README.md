
# EduAssignment Webapp 📚

This Node.js program serves as an Assignment Management System, enabling users to generate, modify, and remove assignments. Additionally, it facilitates assignment submissions by implementing validation measures, such as maximum attempts and submission deadlines. User authentication is integrated into the system, employing basic HTTP authentication with email and password verification.

## Technologies Used 🚀

- **Node.js**: The application utilizes Node.js for server-side JavaScript development.
- **Express**: Express serves as the web application framework, managing HTTP requests and responses.
- **Sequelize**: Sequelize functions as the Object-Relational Mapping (ORM) tool, facilitating interactions with the database.
- **bcrypt**: bcrypt is employed to hash and verify passwords, enhancing user authentication security.
- **AWS SDK**: The AWS SDK is integrated for communication with Amazon Simple Notification Service (SNS) to publish messages.
- **CloudWatch**: CloudWatch is utilized for logging, offering both console and file-based logging capabilities.
- **CSV Parser**: The application is equipped to handle CSV files, enabling the creation or modification of user accounts.
- **StatsD**: StatsD is implemented for the collection of custom application metrics.

## API Endpoints 🌐

### Health Check

- `/healthz`: Performs a health check, verifying the connection to the database.

### Assignment Endpoints

- `GET /v1/assignments`: Retrieve a list of all assignments.
- `GET /v1/assignments/:id`: Retrieves a specific assignment by ID.
- `POST /v1/assignments`: Create a new assignment with various validations:
  - Name must be a non-empty string.
  - Points must be a number between 1 and 10.
  - Number of attempts must be a positive integer.
  - Deadline must be a valid date.
- `PUT /v1/assignments/:id`: Update an assignment (restricted to the owner) with similar validations as the creation.
- `DELETE /v1/assignments/:id`: Delete an assignment (restricted to the owner).

### Assignment Submission

- `POST /v1/assignments/:id/submission`: Submit an assignment with a submission URL and the following validations:
  - Submission URL must be a non-empty string.
  - Submission URL must be a valid URL ending with '.zip'.
  - Users cannot submit more times than the specified number of attempts.
  - Submissions after the deadline are not allowed.

```env
DB_HOSTNAME=127.0.0.1
DB_USER=**your-user**
DB_PASSWORD=**your-password**
DB_NAME=**your-dbname**
```
## Running the Application 🚀
1. Install dependencies: `npm install`
2. Set environment variables in a `.env` file.
3. Run the application: `npm start`

The server will run on port 3000 by default.

## Testing 🧪

The application includes basic Integration tests. You can run tests using: `npm test`

## Deployment 

The application can be deployed to a hosting service or cloud provider. Ensure that the necessary environment variables are configured for production use.

## Contributing

Contributions are welcome. Fork the repository, make changes, and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
