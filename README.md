# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# Wildflower Arts Collective Website

## MySQL Checklist Setup

The monthly checklist feature uses MySQL to store and retrieve tasks. Follow these steps to set up the MySQL database:

1. **Install MySQL** on your server if you haven't already.

2. **Create a database**:
   ```sql
   CREATE DATABASE wildflower;
   ```

3. **Create a database user** (replace `your_password` with a secure password):
   ```sql
   CREATE USER 'wildflower_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON wildflower.* TO 'wildflower_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Set environment variables** for the database connection. You can either:
   - Add them to your environment:
     ```
     export DB_HOST=localhost
     export DB_USER=wildflower_user
     export DB_PASSWORD=your_password
     export DB_NAME=wildflower
     ```
   - Or create a `.env` file in the project root directory:
     ```
     DB_HOST=localhost
     DB_USER=wildflower_user
     DB_PASSWORD=your_password
     DB_NAME=wildflower
     ```

5. **Install the MySQL package**:
   ```bash
   npm install mysql2
   ```

6. **Start the server**:
   ```bash
   npm start
   ```

The database tables will be created automatically when the server starts. The checklist feature uses two tables:

- `checklist_items`: Stores the core task data
- `monthly_progress`: Tracks task completion status for each month

## API Endpoints

The checklist feature uses the following API endpoints:

- `GET /api/checklist?year=2023&month=7`: Get all tasks for a specific month and year
- `POST /api/checklist`: Create a new task
- `PUT /api/checklist/:id`: Update an existing task
- `DELETE /api/checklist/:id`: Delete a task
