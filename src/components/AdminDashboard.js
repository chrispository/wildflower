import React, { useState } from 'react';
import AdminEvents from './AdminEvents';
import AdminArtists from './AdminArtists';
import ThemeSwitcher from './ThemeSwitcher';

function AdminDashboard({ onLogout, currentTheme, setTheme }) {
    const [activeSection, setActiveSection] = useState('events');

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <div className="admin-controls">
                    <div className="section-control">
                        <label>Manage:</label>
                        <select 
                            value={activeSection}
                            onChange={(e) => setActiveSection(e.target.value)}
                            className="section-select"
                        >
                            <option value="events">Events</option>
                            <option value="artists">Artists</option>
                        </select>
                    </div>
                    <div className="theme-control">
                        <label>Theme:</label>
                        <ThemeSwitcher currentTheme={currentTheme} setTheme={setTheme} />
                    </div>
                </div>
            </div>
            <div className="admin-content">
                {activeSection === 'events' ? <AdminEvents /> : <AdminArtists />}
            </div>
            <div className="admin-footer">
                <button onClick={onLogout} className="logout-button">Logout</button>
            </div>
        </div>
    );
}

export default AdminDashboard; 