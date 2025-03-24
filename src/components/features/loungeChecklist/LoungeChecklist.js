import React, { useState, useEffect } from 'react';
import './LoungeChecklist.css';

function LoungeChecklist() {
    const [tasks, setTasks] = useState(() => {
        const savedTasks = localStorage.getItem('loungeChecklist');
        return savedTasks ? JSON.parse(savedTasks) : [];
    });
    
    const [artists, setArtists] = useState(() => {
        const savedArtists = localStorage.getItem('loungeArtists');
        return savedArtists ? JSON.parse(savedArtists) : [];
    });
    
    const [newTask, setNewTask] = useState('');
    const [newDeadline, setNewDeadline] = useState('');
    const [newTime, setNewTime] = useState('09:00');
    const [isArtistSectionExpanded, setIsArtistSectionExpanded] = useState(false);
    const [newArtistRealName, setNewArtistRealName] = useState('');
    const [newArtistStageName, setNewArtistStageName] = useState('');
    const [newArtistContact, setNewArtistContact] = useState('');
    const [copyMessage, setCopyMessage] = useState('');
    const [copyNotificationVisible, setCopyNotificationVisible] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editTaskText, setEditTaskText] = useState('');
    const [editTaskDeadline, setEditTaskDeadline] = useState('');
    const [editTaskTime, setEditTaskTime] = useState('');
    
    useEffect(() => {
        localStorage.setItem('loungeChecklist', JSON.stringify(tasks));
    }, [tasks]);
    
    useEffect(() => {
        localStorage.setItem('loungeArtists', JSON.stringify(artists));
    }, [artists]);
    
    // Clear copy message after 2 seconds
    useEffect(() => {
        if (copyMessage) {
            setCopyNotificationVisible(true);
            const timer = setTimeout(() => {
                setCopyNotificationVisible(false);
                setTimeout(() => {
                    setCopyMessage('');
                }, 300); // Wait for fade out animation to complete
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [copyMessage]);
    
    const addTask = () => {
        if (newTask.trim() === '' || !newDeadline) return;
        
        const task = {
            id: Date.now(),
            text: newTask,
            deadline: newDeadline,
            time: newTime,
            completed: false
        };
        
        setTasks([...tasks, task]);
        setNewTask('');
        setNewDeadline('');
        setNewTime('09:00');
    };
    
    const toggleComplete = (id) => {
        setTasks(tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };
    
    const removeTask = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
    };
    
    const startEditingTask = (task) => {
        setEditingTaskId(task.id);
        setEditTaskText(task.text);
        setEditTaskDeadline(task.deadline);
        setEditTaskTime(task.time);
    };
    
    const saveEditedTask = () => {
        if (editTaskText.trim() === '' || !editTaskDeadline) return;
        
        setTasks(tasks.map(task => 
            task.id === editingTaskId 
                ? { ...task, text: editTaskText, deadline: editTaskDeadline, time: editTaskTime }
                : task
        ));
        
        // Reset editing state
        setEditingTaskId(null);
        setEditTaskText('');
        setEditTaskDeadline('');
        setEditTaskTime('');
    };
    
    const cancelEditing = () => {
        setEditingTaskId(null);
        setEditTaskText('');
        setEditTaskDeadline('');
        setEditTaskTime('');
    };
    
    // Function to format phone number
    const formatPhoneNumber = (phoneNumberString) => {
        // Strip all non-numeric characters
        let cleaned = ('' + phoneNumberString).replace(/\D/g, '');
        
        // Remove leading "1" if present (country code)
        if (cleaned.length > 10 && cleaned.charAt(0) === '1') {
            cleaned = cleaned.substring(1);
        }
        
        // Check if the number is valid (10 digits for US phone)
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}`;
        }
        
        // If not a valid 10-digit number, return the original input
        return phoneNumberString;
    };
    
    // Check if string is likely a phone number
    const isLikelyPhoneNumber = (str) => {
        // Remove all non-numeric characters
        const digitsOnly = str.replace(/\D/g, '');
        // Check if we have 10-11 digits (with optional country code)
        return digitsOnly.length >= 10 && digitsOnly.length <= 11;
    };
    
    const addArtist = () => {
        if (newArtistRealName.trim() === '' && newArtistStageName.trim() === '') return;
        
        // Format contact if it looks like a phone number
        const formattedContact = isLikelyPhoneNumber(newArtistContact) 
            ? formatPhoneNumber(newArtistContact)
            : newArtistContact;
            
        const artist = {
            id: Date.now(),
            realName: newArtistRealName,
            stageName: newArtistStageName,
            contact: formattedContact
        };
        
        setArtists([...artists, artist]);
        setNewArtistRealName('');
        setNewArtistStageName('');
        setNewArtistContact('');
    };
    
    const removeArtist = (id) => {
        setArtists(artists.filter(artist => artist.id !== id));
    };
    
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopyMessage('Number copied to clipboard');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                setCopyMessage('Copy failed');
            });
    };
    
    // Sort tasks by deadline (closest first)
    const sortedTasks = [...tasks].sort((a, b) => {
        // Create dates without timezone conversion issues
        const [yearA, monthA, dayA] = a.deadline.split('-').map(Number);
        const [hoursA, minutesA] = a.time.split(':').map(Number);
        
        const [yearB, monthB, dayB] = b.deadline.split('-').map(Number);
        const [hoursB, minutesB] = b.time.split(':').map(Number);
        
        // Create date objects (months are 0-indexed in JS)
        const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
        const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
        
        return dateA - dateB;
    });
    
    // Format time to display in AM/PM format
    const formatTimeDisplay = (time) => {
        switch(time) {
            case '09:00': return '9:00am';
            case '12:00': return '12:00pm';
            case '18:00': return '6:00pm';
            default: return time;
        }
    };
    
    // Format date correctly without timezone issues
    const formatDeadlineDate = (dateString) => {
        const [year, month, day] = dateString.split('-').map(Number);
        // Create a date object using local time values to avoid timezone shift
        const date = new Date(year, month - 1, day);
        
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };
    
    return (
        <section className="checklist-container">
            {copyMessage && (
                <div className={`notification-toast ${copyNotificationVisible ? 'visible' : ''}`}>
                    {copyMessage}
                </div>
            )}
            
            <h2>Lounge Checklist</h2>
            <p className="checklist-description">
                Track your show preparation tasks, sorted by deadline.
            </p>
            
            <div className="add-task-form">
                <input
                    type="text"
                    placeholder="Add a new task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="task-input"
                />
                <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="deadline-input"
                />
                <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="time-select"
                >
                    <option value="09:00">9:00am</option>
                    <option value="12:00">12:00pm</option>
                    <option value="18:00">6:00pm</option>
                </select>
                <button onClick={addTask} className="add-task-button">Add Task</button>
            </div>
            
            <div className="artist-contacts-section">
                <div 
                    className="artist-section-header"
                    onClick={() => setIsArtistSectionExpanded(!isArtistSectionExpanded)}
                >
                    <h3>Artist Contacts {isArtistSectionExpanded ? '-' : '+'}</h3>
                </div>
                
                {isArtistSectionExpanded && (
                    <div className="artist-section-content">
                        <div className="add-artist-form">
                            <input
                                type="text"
                                placeholder="Firstname Lastname..."
                                value={newArtistRealName}
                                onChange={(e) => setNewArtistRealName(e.target.value)}
                                className="artist-input"
                            />
                            <input
                                type="text"
                                placeholder="Stage Name..."
                                value={newArtistStageName}
                                onChange={(e) => setNewArtistStageName(e.target.value)}
                                className="artist-input"
                            />
                            <input
                                type="text"
                                placeholder="Contact info (phone, email, etc.)..."
                                value={newArtistContact}
                                onChange={(e) => setNewArtistContact(e.target.value)}
                                className="artist-input"
                            />
                            <button onClick={addArtist} className="add-artist-button" aria-label="Add Contact">+</button>
                        </div>
                        
                        <div className="artists-list">
                            {artists.length === 0 ? (
                                <div className="empty-artists">
                                    No artist contacts yet. Add contacts above.
                                </div>
                            ) : (
                                artists.map(artist => (
                                    <div key={artist.id} className="artist-card">
                                        <div className="artist-info">
                                            {artist.stageName && (
                                                <div className="artist-stage-name">{artist.stageName}</div>
                                            )}
                                            {artist.realName && (
                                                <div className="artist-real-name">{artist.realName}</div>
                                            )}
                                            <div className="artist-contact-row">
                                                <div className="artist-contact">{artist.contact}</div>
                                                <div className="contact-actions">
                                                    <button 
                                                        onClick={() => copyToClipboard(artist.contact)}
                                                        className="copy-button"
                                                        aria-label="Copy contact information"
                                                    >
                                                        📋
                                                    </button>
                                                    <a 
                                                        href={`sms:${artist.contact}`}
                                                        className="text-button"
                                                        aria-label="Send text message"
                                                    >
                                                        💬
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeArtist(artist.id)}
                                            className="delete-button"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="tasks-list">
                {sortedTasks.length === 0 ? (
                    <div className="empty-state">
                        No tasks yet. Add tasks to organize your show prep!
                    </div>
                ) : (
                    sortedTasks.map(task => (
                        <div 
                            key={task.id} 
                            className={`task-card ${task.completed ? 'completed' : ''}`}
                        >
                            {editingTaskId === task.id ? (
                                <div className="edit-task-form">
                                    <input
                                        type="text"
                                        value={editTaskText}
                                        onChange={(e) => setEditTaskText(e.target.value)}
                                        className="edit-task-input"
                                    />
                                    <div className="edit-task-date-time">
                                        <input
                                            type="date"
                                            value={editTaskDeadline}
                                            onChange={(e) => setEditTaskDeadline(e.target.value)}
                                            className="edit-deadline-input"
                                        />
                                        <select
                                            value={editTaskTime}
                                            onChange={(e) => setEditTaskTime(e.target.value)}
                                            className="edit-time-select"
                                        >
                                            <option value="09:00">9:00am</option>
                                            <option value="12:00">12:00pm</option>
                                            <option value="18:00">6:00pm</option>
                                        </select>
                                    </div>
                                    <div className="edit-actions">
                                        <button onClick={saveEditedTask} className="save-button">Save</button>
                                        <button onClick={cancelEditing} className="cancel-button">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="task-header">
                                        <div className="checkbox-container">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => toggleComplete(task.id)}
                                                id={`task-${task.id}`}
                                            />
                                            <label 
                                                htmlFor={`task-${task.id}`}
                                                className={task.completed ? 'completed-text' : ''}
                                            >
                                                {task.text}
                                            </label>
                                        </div>
                                        <div className="task-actions">
                                            <button 
                                                onClick={() => startEditingTask(task)}
                                                className="edit-button"
                                                aria-label="Edit task"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                onClick={() => removeTask(task.id)}
                                                className="delete-button"
                                                aria-label="Delete task"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                    <div className="task-deadline">
                                        Deadline: {formatDeadlineDate(task.deadline)} at {formatTimeDisplay(task.time)}
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

export default LoungeChecklist; 