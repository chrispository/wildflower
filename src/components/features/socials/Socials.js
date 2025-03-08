import React from 'react';
import './Socials.css'; // Import the CSS file
import config from '../../../config/env'; // Import the config file

function Socials() {
    console.log("Socials component loaded"); // Log to verify component loading

    return (
        <section>
            <div className="artist-list">
                <div className="artist-row left">
                    <div className="artist-image-container">
                        <a href="https://www.instagram.com/wildflowerartsco"><img src="/images/instagramlogo.png" alt="Instagram" className="artist-image" /></a>
                    </div>
                    <div className="artist-info">
                        <div className="artist-name">Instagram</div>
                        <div className="artist-description">Follow us on Instagram for the latest updates, behind-the-scenes content, and more!</div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Socials; 