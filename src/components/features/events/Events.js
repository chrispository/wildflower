import React from 'react';
import './Events.css';
import { formatDateWithDay } from '../../../utils/dateFormatters';

export const events = [
    {
        name: "Grow Room Monthly Showcase",
        date: "March 22, 2025",
        time: "9:00 PM - 1:00 AM",
        description: "Our monthly curated showcase of local artists, producers, and DJs.",
        location: "The Lounge",
        flyer: `/images/mar22lounge.png`,
        ticketLink: "https://blackboxdenver.co/events/wildflower-arts-mar22"
    },
    {
        name: "Grow Room Monthly Showcase",
        date: "April 26, 2025",
        time: "9:00 PM - 1:00 AM",
        description: "Our monthly curated showcase of local artists, producers, and DJs.",
        location: "The Lounge ",
        flyer: `/images/feb15thlounge.png`,
        ticketLink: "https://blackboxdenver.co/events/wildflower-arts-feb15"
    }
    ];

function Events() {
    return (
        <section>
            <div className="events-list">
                {events.map((event, index) => (
                    <div className="event-card" key={event.name}>
                        <div className="event-header">
                            <h3 style={{ fontFamily: 'Roboto Condensed' }}>
                                {event.name}
                            </h3>
                            <div className="event-datetime">
                                <div className="event-date">
                                    {formatDateWithDay(event.date)}
                                </div>
                                <div className="event-time">
                                    {event.time}
                                </div>
                            </div>
                        </div>
                        <div className="event-flyer">
                            <img src={event.flyer} alt={`${event.name} flyer`} />
                        </div>
                        <div className="event-details">
                            <p>{event.description}</p>
                            {event.ticketLink && (
                                <a
                                    href={event.ticketLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ticket-link-pill"
                                >
                                    Get Tickets
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Events; 