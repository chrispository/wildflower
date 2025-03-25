<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: https://wildflowerartsco.com');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');  // Cache preflight for 24 hours
    exit(0);
}

// Adding a global try-catch around the entire script to catch any unexpected errors
try {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: https://wildflowerartsco.com');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type');

    $socket = '/media/sdg1/j7qf5y/private/mysql/socket';
    $db   = 'checklist';
    $user = 'root';
    $pass = '2DFoIOxdKlXJQ7iI';
    $charset = 'utf8mb4';

    $dsn = "mysql:unix_socket=$socket;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    
    $pdo = new PDO($dsn, $user, $pass, $options);

    // Create april_tasks table by copying from task_template
    $sql = "CREATE TABLE IF NOT EXISTS april_tasks LIKE task_template;
            INSERT INTO april_tasks SELECT * FROM task_template;";
    
    $pdo->exec($sql);

    // Create tasks table if it doesn't exist
    $sql = "CREATE TABLE IF NOT EXISTS tasks (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        task VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        due_description VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($sql);
    
    // Create artists table if it doesn't exist
    $sql = "CREATE TABLE IF NOT EXISTS artists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        legalname VARCHAR(255),
        stagename VARCHAR(255) UNIQUE,
        phone VARCHAR(255),
        social VARCHAR(255),
        show_months JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($sql);
    
    // Create index for faster lookups on stagename if it doesn't exist
    try {
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_stagename ON artists(stagename)");
    } catch (\PDOException $e) {
        // Index might already exist or not be supported by MySQL version - this is non-critical
    }
    
    // Get the request method and path
    $method = $_SERVER['REQUEST_METHOD'];
    $path = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';

    // Handle based on the path
    if (strpos($path, '/artists') === 0 || isset($_GET['artists'])) {
        // Artist endpoints
        handleArtistRequests($pdo, $method);
    } else {
        // Default to task endpoints
        handleTaskRequests($pdo, $method);
    }
} catch (Exception $e) {
    // Log the error
    error_log("Uncaught exception: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    
    // Always return a valid JSON response, even on errors
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'error' => 'An unexpected error occurred',
        'message' => $e->getMessage()
    ]);
}

/**
 * Handle artist-related requests
 */
function handleArtistRequests($pdo, $method) {
    switch ($method) {
        case 'GET':
            // Get month filter from query params
            $month = isset($_GET['month']) ? (int)$_GET['month'] : null;
            
            // Base query
            $sql = "SELECT * FROM artists";
            
            // Add month filter if provided
            if ($month) {
                $sql .= " WHERE JSON_CONTAINS(show_months, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$month]);
            } else {
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
            }
            
            $artists = $stmt->fetchAll();
            echo json_encode($artists);
            break;
            
        case 'POST':
            // Get data from the request body
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate data
            if (!isset($data['realName']) && !isset($data['stageName'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Real name or stage name is required']);
                return;
            }
            
            // Initialize show_months as a JSON array with the current month
            $show_months = isset($data['showMonth']) ? json_encode([$data['showMonth']]) : '[]';
            
            // Insert new artist
            $stmt = $pdo->prepare("INSERT INTO artists (real_name, stage_name, contact, social_link, show_months) 
                                  VALUES (:real_name, :stage_name, :contact, :social_link, :show_months)");
            
            $stmt->execute([
                ':real_name' => $data['realName'] ?? '',
                ':stage_name' => $data['stageName'] ?? '',
                ':contact' => $data['contact'] ?? '',
                ':social_link' => $data['social'] ?? '',
                ':show_months' => $show_months
            ]);
            
            // Return the created artist with ID
            $artistId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM artists WHERE id = :id");
            $stmt->execute([':id' => $artistId]);
            $artist = $stmt->fetch();
            
            // Map DB field names to client-side names
            $artist['realName'] = $artist['real_name'];
            $artist['stageName'] = $artist['stage_name'];
            $artist['social'] = $artist['social_link'];
            $artist['showMonths'] = json_decode($artist['show_months']);
            
            echo json_encode($artist);
            break;
            
        case 'PUT':
            // Get artist ID from the query parameters
            $artistId = isset($_GET['id']) ? $_GET['id'] : null;
            if (!$artistId) {
                http_response_code(400);
                echo json_encode(['error' => 'Artist ID is required']);
                return;
            }
            
            // Get data from the request body
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Get current show_months
            $stmt = $pdo->prepare("SELECT show_months FROM artists WHERE id = :id");
            $stmt->execute([':id' => $artistId]);
            $currentArtist = $stmt->fetch();
            $currentMonths = json_decode($currentArtist['show_months'] ?? '[]');
            
            // Add new month if provided
            if (isset($data['showMonth']) && !in_array($data['showMonth'], $currentMonths)) {
                $currentMonths[] = $data['showMonth'];
            }
            
            // Update artist
            $stmt = $pdo->prepare("UPDATE artists 
                                  SET real_name = :real_name, 
                                      stage_name = :stage_name, 
                                      contact = :contact, 
                                      social_link = :social_link,
                                      show_months = :show_months
                                  WHERE id = :id");
            
            $stmt->execute([
                ':id' => $artistId,
                ':real_name' => $data['realName'] ?? '',
                ':stage_name' => $data['stageName'] ?? '',
                ':contact' => $data['contact'] ?? '',
                ':social_link' => $data['social'] ?? '',
                ':show_months' => json_encode($currentMonths)
            ]);
            
            // Return the updated artist
            $stmt = $pdo->prepare("SELECT * FROM artists WHERE id = :id");
            $stmt->execute([':id' => $artistId]);
            $artist = $stmt->fetch();
            
            // Map DB field names to client-side names
            $artist['realName'] = $artist['real_name'];
            $artist['stageName'] = $artist['stage_name'];
            $artist['social'] = $artist['social_link'];
            $artist['showMonths'] = json_decode($artist['show_months']);
            
            echo json_encode($artist);
            break;
            
        case 'DELETE':
            // Get artist ID from the query parameters
            $artistId = isset($_GET['id']) ? $_GET['id'] : null;
            if (!$artistId) {
                http_response_code(400);
                echo json_encode(['error' => 'Artist ID is required']);
                return;
            }
            
            // Delete artist
            $stmt = $pdo->prepare("DELETE FROM artists WHERE id = :id");
            $stmt->execute([':id' => $artistId]);
            
            echo json_encode(['success' => true, 'message' => 'Artist deleted successfully']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}

/**
 * Handle task-related requests
 */
function handleTaskRequests($pdo, $method) {
    // Get the table name based on month
    $month = isset($_GET['month']) ? (int)$_GET['month'] : null;
    $table = ($month === 4) ? 'april_tasks' : 'tasks';
    
    switch ($method) {
        case 'GET':
            // Get tasks for a specific month and year
            $year = isset($_GET['year']) ? (int)$_GET['year'] : null;
            $month = isset($_GET['month']) ? (int)$_GET['month'] : null;
            
            if (!$year || !$month) {
                http_response_code(400);
                echo json_encode(['error' => 'Year and month are required']);
                return;
            }
            
            try {
                // First check if the table exists
                $stmt = $pdo->prepare("SHOW TABLES LIKE :table");
                $stmt->execute([':table' => $table]);
                if ($stmt->rowCount() === 0) {
                    // Table doesn't exist, return empty array
                    echo json_encode([]);
                    return;
                }
                
                // Check table structure to see what columns exist
                $stmt = $pdo->prepare("DESCRIBE $table");
                $stmt->execute();
                $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                // Build query based on available columns
                if (in_array('due', $columns)) {
                    // Use due column if it exists
                    $sql = "SELECT * FROM $table WHERE due IS NULL OR (MONTH(due) = :month AND YEAR(due) = :year)";
                } else if (in_array('due_description', $columns)) {
                    // Fall back to due_description if that exists
                    $sql = "SELECT * FROM $table WHERE due_description IS NULL OR (MONTH(due_description) = :month AND YEAR(due_description) = :year)";
                } else {
                    // No date column, just get all tasks
                    $sql = "SELECT * FROM $table";
                }
                
                $stmt = $pdo->prepare($sql);
                
                // Only bind parameters if we're using them
                if (strpos($sql, ':month') !== false) {
                    $stmt->execute([':month' => $month, ':year' => $year]);
                } else {
                    $stmt->execute();
                }
                
                $tasks = $stmt->fetchAll();
                
                // Transform tasks to match frontend format
                $transformedTasks = [];
                foreach ($tasks as $task) {
                    // Default values
                    $taskData = [
                        'id' => $task['id'] ?? $task['item_id'] ?? null,
                        'task' => $task['task'] ?? '',
                        'due_date' => '',
                        'due_time' => '09:00',
                        'is_completed' => false
                    ];
                    
                    // Handle due date if it exists
                    if (isset($task['due']) && $task['due'] !== null) {
                        try {
                            $dueDateTime = new DateTime($task['due']);
                            $taskData['due_date'] = $dueDateTime->format('Y-m-d');
                            $taskData['due_time'] = $dueDateTime->format('H:i');
                        } catch (Exception $e) {
                            error_log("Error parsing datetime: " . $e->getMessage());
                        }
                    } else if (isset($task['due_description']) && $task['due_description'] !== null) {
                        // Try to extract date/time from due_description
                        $parts = explode(' ', $task['due_description']);
                        if (count($parts) >= 1) {
                            $taskData['due_date'] = $parts[0];
                        }
                        if (count($parts) >= 2) {
                            $taskData['due_time'] = substr($parts[1], 0, 5);
                        }
                    }
                    
                    // Handle completed status
                    if (isset($task['complete'])) {
                        $taskData['is_completed'] = (bool)$task['complete'];
                    } else if (isset($task['is_completed'])) {
                        $taskData['is_completed'] = (bool)$task['is_completed'];
                    }
                    
                    // Only add tasks with valid IDs
                    if ($taskData['id'] !== null) {
                        $transformedTasks[] = $taskData;
                    }
                }
                
                echo json_encode($transformedTasks);
            } catch (Exception $e) {
                error_log("Database error: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Database error occurred', 'details' => $e->getMessage()]);
            }
            break;
            
        case 'POST':
            // Get data from the request body
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate data
            if (!isset($data['task'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Task is required']);
                return;
            }
            
            try {
                // Check table structure to see what columns exist
                $stmt = $pdo->prepare("DESCRIBE $table");
                $stmt->execute();
                $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                // Build query based on available columns
                $fieldNames = [];
                $placeholders = [];
                $params = [];
                
                // Task field exists in all variations
                $fieldNames[] = 'task';
                $placeholders[] = ':task';
                $params[':task'] = $data['task'];
                
                // Handle due/due_description field
                if (in_array('due', $columns)) {
                    $fieldNames[] = 'due';
                    $placeholders[] = ':due';
                    $params[':due'] = !empty($data['due_date']) 
                        ? $data['due_date'] . ' ' . ($data['due_time'] ?? '09:00:00')
                        : null;
                } else if (in_array('due_description', $columns)) {
                    $fieldNames[] = 'due_description';
                    $placeholders[] = ':due_description';
                    $params[':due_description'] = !empty($data['due_date']) 
                        ? $data['due_date'] . ' ' . ($data['due_time'] ?? '09:00:00')
                        : null;
                }
                
                // Handle complete/is_completed field
                if (in_array('complete', $columns)) {
                    $fieldNames[] = 'complete';
                    $placeholders[] = ':complete';
                    $params[':complete'] = 0; // False
                } else if (in_array('is_completed', $columns)) {
                    $fieldNames[] = 'is_completed';
                    $placeholders[] = ':is_completed';
                    $params[':is_completed'] = 0; // False
                }
                
                // Handle category field if it exists
                if (in_array('category', $columns)) {
                    $fieldNames[] = 'category';
                    $placeholders[] = ':category';
                    $params[':category'] = $data['category'] ?? '';
                }
                
                // Build and execute the query
                $sql = "INSERT INTO $table (" . implode(', ', $fieldNames) . ") VALUES (" . implode(', ', $placeholders) . ")";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                
                // Return the created task with ID
                $taskId = $pdo->lastInsertId();
                
                echo json_encode([
                    'id' => $taskId,
                    'task' => $data['task'],
                    'due_date' => $data['due_date'] ?? '',
                    'due_time' => $data['due_time'] ?? '09:00',
                    'is_completed' => false
                ]);
            } catch (Exception $e) {
                error_log("Database error: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Database error occurred', 'details' => $e->getMessage()]);
            }
            break;
            
        case 'PUT':
            // Get task ID from the query parameters
            $taskId = isset($_GET['id']) ? $_GET['id'] : null;
            if (!$taskId) {
                http_response_code(400);
                echo json_encode(['error' => 'Task ID is required']);
                return;
            }
            
            // Get data from the request body
            $data = json_decode(file_get_contents('php://input'), true);
            
            try {
                // Check table structure to see what columns exist
                $stmt = $pdo->prepare("DESCRIBE $table");
                $stmt->execute();
                $columns = array_map(function($col) {
                    return $col['Field'];
                }, $stmt->fetchAll());
                
                // Build the SQL update based on what's being updated
                $updates = [];
                $params = [];
                
                // Determine the ID field name
                $idField = in_array('id', $columns) ? 'id' : 'item_id';
                $params[':id'] = $taskId;
                
                // Task field
                if (isset($data['task']) && in_array('task', $columns)) {
                    $updates[] = "task = :task";
                    $params[':task'] = $data['task'];
                }
                
                // Due date/time
                if ((isset($data['due_date']) || isset($data['due_time'])) && in_array('due', $columns)) {
                    if (empty($data['due_date'])) {
                        $updates[] = "due = NULL";
                    } else {
                        $due = $data['due_date'] . ' ' . ($data['due_time'] ?? '09:00:00');
                        $updates[] = "due = :due";
                        $params[':due'] = $due;
                    }
                } else if ((isset($data['due_date']) || isset($data['due_time'])) && in_array('due_description', $columns)) {
                    if (empty($data['due_date'])) {
                        $updates[] = "due_description = NULL";
                    } else {
                        $due = $data['due_date'] . ' ' . ($data['due_time'] ?? '09:00:00');
                        $updates[] = "due_description = :due_description";
                        $params[':due_description'] = $due;
                    }
                }
                
                // Completion status
                if (isset($data['is_completed'])) {
                    if (in_array('complete', $columns)) {
                        $updates[] = "complete = :complete";
                        $params[':complete'] = $data['is_completed'] ? 1 : 0;
                    } else if (in_array('is_completed', $columns)) {
                        $updates[] = "is_completed = :is_completed";
                        $params[':is_completed'] = $data['is_completed'] ? 1 : 0;
                    }
                }
                
                // Execute update if we have something to update
                if (!empty($updates)) {
                    $sql = "UPDATE $table SET " . implode(', ', $updates) . " WHERE $idField = :id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                }
                
                // Return the updated task
                $stmt = $pdo->prepare("SELECT * FROM $table WHERE $idField = :id");
                $stmt->execute([':id' => $taskId]);
                $task = $stmt->fetch();
                
                // Build response
                $response = [
                    'id' => $task[$idField],
                    'task' => $task['task'] ?? '',
                    'due_date' => '',
                    'due_time' => '09:00',
                    'is_completed' => false
                ];
                
                // Handle due date
                if (isset($task['due']) && $task['due'] !== null) {
                    try {
                        $dueDateTime = new DateTime($task['due']);
                        $response['due_date'] = $dueDateTime->format('Y-m-d');
                        $response['due_time'] = $dueDateTime->format('H:i');
                    } catch (Exception $e) {
                        error_log("Error parsing datetime: " . $e->getMessage());
                    }
                } else if (isset($task['due_description']) && $task['due_description'] !== null) {
                    $parts = explode(' ', $task['due_description']);
                    if (count($parts) >= 1) {
                        $response['due_date'] = $parts[0];
                    }
                    if (count($parts) >= 2) {
                        $response['due_time'] = substr($parts[1], 0, 5);
                    }
                }
                
                // Handle completion status
                if (isset($task['complete'])) {
                    $response['is_completed'] = (bool)$task['complete'];
                } else if (isset($task['is_completed'])) {
                    $response['is_completed'] = (bool)$task['is_completed'];
                }
                
                echo json_encode($response);
            } catch (Exception $e) {
                error_log("Database error: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Database error occurred', 'details' => $e->getMessage()]);
            }
            break;
            
        case 'DELETE':
            // Get task ID from the query parameters
            $taskId = isset($_GET['id']) ? $_GET['id'] : null;
            if (!$taskId) {
                http_response_code(400);
                echo json_encode(['error' => 'Task ID is required']);
                return;
            }
            
            try {
                // Check if the ID column is 'id' or 'item_id'
                $stmt = $pdo->prepare("DESCRIBE $table");
                $stmt->execute();
                $columns = array_map(function($col) {
                    return $col['Field'];
                }, $stmt->fetchAll());
                
                $idField = in_array('id', $columns) ? 'id' : 'item_id';
                
                // Delete task
                $stmt = $pdo->prepare("DELETE FROM $table WHERE $idField = :id");
                $stmt->execute([':id' => $taskId]);
                
                echo json_encode(['success' => true, 'message' => 'Task deleted successfully']);
            } catch (Exception $e) {
                error_log("Database error: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Database error occurred', 'details' => $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} 