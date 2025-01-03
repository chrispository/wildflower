import React, { useState, useEffect } from 'react';
import { events as initialEvents } from './Events';
import FileUpload from './FileUpload';

const formatDateAbbrev = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
};

function AdminEvents() {
    const [events, setEvents] = useState([]);
    const [newEvent, setNewEvent] = useState({
        name: '',
        date: '',
        time: '',
        description: '',
        location: '',
        flyer: '',
        ticketLink: ''
    });
    const [expandedEvent, setExpandedEvent] = useState(null);
    const [isAddEventExpanded, setIsAddEventExpanded] = useState(false);

    useEffect(() => {
        const savedEvents = JSON.parse(localStorage.getItem('events'));
        let eventsToUse;
        
        if (savedEvents && savedEvents.length > 0) {
            eventsToUse = savedEvents;
        } else {
            eventsToUse = initialEvents.map(event => ({
                ...event,
                id: Date.now() + Math.random()
            }));
        }

        const sortedEvents = eventsToUse.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });

        setEvents(sortedEvents);
        localStorage.setItem('events', JSON.stringify(sortedEvents));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const updatedEvents = [...events, { ...newEvent, id: Date.now() }];
        setEvents(updatedEvents);
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        setNewEvent({
            name: '',
            date: '',
            time: '',
            description: '',
            location: '',
            flyer: '',
            ticketLink: ''
        });
    };

    const handleUpdate = (eventId, updatedData) => {
        const updatedEvents = events.map(event => 
            event.id === eventId ? { ...updatedData, id: eventId } : event
        );
        setEvents(updatedEvents);
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        setExpandedEvent(null);
    };

    const handleDelete = (eventId) => {
        const updatedEvents = events.filter(event => event.id !== eventId);
        setEvents(updatedEvents);
        localStorage.setItem('events', JSON.stringify(updatedEvents));
    };

    return (
        <div className="admin-events">
            <section className="add-event-section event-item">
                <div 
                    className="event-header"
                    onClick={() => setIsAddEventExpanded(!isAddEventExpanded)}
                >
                    <div className="artist-header-content">
                        <span className="expand-icon">
                            {isAddEventExpanded ? '−' : '+'}
                        </span>
                        <h4>Add New Event</h4>
                    </div>
                </div>
                {isAddEventExpanded && (
                    <div className="event-edit-form">
                        <form onSubmit={handleSubmit} className="event-form">
                            <div className="form-group">
                                <label>Event Name:</label>
                                <input
                                    type="text"
                                    value={newEvent.name}
                                    onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Date:</label>
                                <input
                                    type="text"
                                    value={newEvent.date}
                                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                                    placeholder="e.g., Friday, December 28, 2024"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Time:</label>
                                <input
                                    type="text"
                                    value={newEvent.time}
                                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                                    placeholder="e.g., 9:00 PM - 2:00 AM"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Location:</label>
                                <input
                                    type="text"
                                    value={newEvent.location}
                                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Event Flyer:</label>
                                <FileUpload
                                    onUploadSuccess={(filePath) => setNewEvent({...newEvent, flyer: filePath})}
                                    currentImage={newEvent.flyer}
                                />
                            </div>
                            <div className="form-group">
                                <label>Ticket Link:</label>
                                <input
                                    type="url"
                                    value={newEvent.ticketLink}
                                    onChange={(e) => setNewEvent({...newEvent, ticketLink: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>
                            <button type="submit" className="submit-button">Add Event</button>
                        </form>
                    </div>
                )}
            </section>

            <section className="manage-events-section">
                <h3>Manage Existing Events</h3>
                <div className="events-accordion">
                    {events.map(event => (
                        <div key={event.id} className="event-item">
                            <div 
                                className="event-header"
                                onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                            >
                                <div className="artist-header-content">
                                    <span className="expand-icon">
                                        {expandedEvent === event.id ? '−' : '+'}
                                    </span>
                                    <div className="event-header-info">
                                        <span className="event-date-abbrev">
                                            {formatDateAbbrev(event.date)}
                                        </span>
                                        <h4>{event.name}</h4>
                                    </div>
                                </div>
                            </div>
                            {expandedEvent === event.id && (
                                <div className="event-edit-form">
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        handleUpdate(event.id, event);
                                    }}>
                                        <div className="form-group">
                                            <label>Name:</label>
                                            <input
                                                type="text"
                                                value={event.name}
                                                onChange={(e) => {
                                                    const updatedEvents = events.map(ev => 
                                                        ev.id === event.id ? {...ev, name: e.target.value} : ev
                                                    );
                                                    setEvents(updatedEvents);
                                                }}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Date:</label>
                                            <input
                                                type="text"
                                                value={event.date}
                                                onChange={(e) => {
                                                    const updatedEvents = events.map(ev => 
                                                        ev.id === event.id ? {...ev, date: e.target.value} : ev
                                                    );
                                                    setEvents(updatedEvents);
                                                }}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Time:</label>
                                            <input
                                                type="text"
                                                value={event.time}
                                                onChange={(e) => {
                                                    const updatedEvents = events.map(ev => 
                                                        ev.id === event.id ? {...ev, time: e.target.value} : ev
                                                    );
                                                    setEvents(updatedEvents);
                                                }}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Location:</label>
                                            <input
                                                type="text"
                                                value={event.location}
                                                onChange={(e) => {
                                                    const updatedEvents = events.map(ev => 
                                                        ev.id === event.id ? {...ev, location: e.target.value} : ev
                                                    );
                                                    setEvents(updatedEvents);
                                                }}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Description:</label>
                                            <textarea
                                                value={event.description}
                                                onChange={(e) => {
                                                    const updatedEvents = events.map(ev => 
                                                        ev.id === event.id ? {...ev, description: e.target.value} : ev
                                                    );
                                                    setEvents(updatedEvents);
                                                }}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Event Flyer:</label>
                                            <FileUpload
                                                onUploadSuccess={(filePath) => {
                                                    const updatedEvents = events.map(ev => 
                                                        ev.id === event.id ? {...ev, flyer: filePath} : ev
                                                    );
                                                    setEvents(updatedEvents);
                                                }}
                                                currentImage={event.flyer}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Ticket Link:</label>
                                            <input
                                                type="url"
                                                value={event.ticketLink}
                                                onChange={(e) => {
                                                    const updatedEvents = events.map(ev => 
                                                        ev.id === event.id ? {...ev, ticketLink: e.target.value} : ev
                                                    );
                                                    setEvents(updatedEvents);
                                                }}
                                            />
                                        </div>
                                        <div className="event-actions">
                                            <button type="submit" className="save-button">Save Changes</button>
                                            <button 
                                                type="button" 
                                                className="delete-button"
                                                onClick={() => handleDelete(event.id)}
                                            >
                                                Delete Event
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default AdminEvents; 