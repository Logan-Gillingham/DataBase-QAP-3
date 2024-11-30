const express = require('express');
const app = express();
const PORT = 3000;
const { Pool } = require('pg');

const pool = new Pool({
  user: 'username', 
  host: 'localhost', 
  database: 'QAP3',
  password: 'password',
  port: 5432,
});

// Function to create the tasks table if it doesn't exist
const createTasksTable = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `);
  } catch (err) {
    console.error('Error creating tasks table:', err);
  } finally {
    await client.release();
  }
};

// Connect to the database on application startup
createTasksTable().then(() => {
  console.log('Connected to PostgreSQL database');

  app.use(express.json());

  // GET /tasks - Get all tasks
  app.get('/tasks', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM tasks');
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      res.status(500).json({ error: 'Failed to retrieve tasks' });
    } finally {
      await client.release();
    }
  });

  // POST /tasks - Add a new task
  app.post('/tasks', async (req, response) => {
    const { description, status } = req.body;
    if (!description || !status) {
      return response.status(400).json({ error: 'All fields (description, status) are required' });
    }

    try {
      const client = await pool.connect();
      const result = await client.query('INSERT INTO tasks (description, status) VALUES ($1, $2) RETURNING *', [description, status]);
      const newTask = result.rows[0];
      response.status(201).json({ message: 'Task added successfully', task: newTask });
    } catch (err) {
      console.error('Error adding task:', err);
      response.status(500).json({ error: 'Failed to add task' });
    } finally {
      await client.release();
    }
  });

  // PUT /tasks/:id - Update a task's status
  app.put('/tasks/:id', async (request, response) => {
    const taskId = parseInt(request.params.id, 10);
    const { status } = request.body;

    try {
      const client = await pool.connect();
      const result = await client.query('UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *', [status, taskId]);
      if (result.rows.length === 0) {
        return response.status(404).json({ error: 'Task not found' });
      }
      const updatedTask = result.rows[0];
      response.json({ message: 'Task updated successfully', task: updatedTask });
    } catch (err) {
      console.error('Error updating task:', err);
      response.status(500).json({ error: 'Failed to update task' });
    } finally {
      await client.release();
    }
  });

  // DELETE /tasks/:id - Delete a task
  app.delete('/tasks/:id', async (request, response) => {
    const taskId = parseInt(request.params.id, 10);
  
    try {
      const client = await pool.connect();
      const result = await client.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [taskId]);
      if (result.rowCount === 0) {
        return response.status(404).json({ error: 'Task not found' });
      }
      response.json({ message: 'Task deleted successfully' });
    } catch (err) {
      console.error('Error deleting task:', err);
      response.status(500).json({ error: 'Failed to delete task' });
    } finally {
      await client.release();
    }
})});