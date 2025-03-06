import React from 'react';
import './Artists.css';
import config from '../../../config/env';

export const artists = [
    {
        name: "sense",
        description: "Sense (Roger Despres) is a multi genre music producer living in Denver, CO. Originally from Albuquerque, Sense has been in Denver for over a decade now and has crafted a unique community within the underground bass scene. Sense is a community advocate, artist, and one of the original founders of the Wildflower Arts Collective.",
        image: `${config.publicUrl}/images/artist_sense.jpg`,
        soundcloud: "https://soundcloud.com/senzsound",
    },
    {
        name: "subjet",
        description: "",
        image: `${config.publicUrl}/images/artist_subjet.jpg`,
        soundcloud: "https://soundcloud.com/subjet-sosus",
    },
    {
        name: "snuggs",
        description: "Snuggs crafts multi-genre sets with a deep emphasis on the low end. Her blend of dubstep, UKG, break beats, DNB, hip hop and timeless classics creates an immersive experience that resonates with both new wave and old-school enthusiasts alike. \n\nShe began her love for live music in Boston, but has been deep in the scene in Colorado since 2012. A show veteran, she is now elated to give back to the community via fresh mixes, visual arts, grassroots events and volunteering.",
        image: `${config.publicUrl}/images/artist_snuggs.jpg`,
        soundcloud: "https://soundcloud.com/snuggs247",
    },
    {
        name: "peanut",
        description: "",
        image: `${config.publicUrl}/images/artist_peanut.jpg`,
        soundcloud: "https://soundcloud.com/peanut-3",
    },
    {
        name: "mama mk",
        description: "Born and raised in Denver, CO, Mama Mk has been long inspired by the city's deeply rooted music scene. Influenced by electronic artists of all genres, she brings eclectic and upbeat energy to the dancefloor. Focusing on curation and technicality, Mama Mk blends bass, UKG, and house frequencies to create a captivating and immersive experience. ",
        image: `${config.publicUrl}/images/artist_mamaMK.jpg`,
        soundcloud: "https://soundcloud.com/mamamk042",
    },
    {
        name: "iyasu",
        description: "Iyasu has been a music creator all his life and he strives to create music that tells a story. Always digging deep from his cultural roots - he loves to draw inspiration from organic sounds and combining them with experimental sound design, expansive vocal textures, and boom-bap grooves. He has been involved with the Denver music scene for the last 7 years, helping to start the Wildflower Arts Collective as well as collaborating & providing support for various music collectives such as Pomegranate Sounds & Dub Den Records. He released his debut EP ‘Espial’ on Simic Records in March of 2023 to officially kick off the project.",
        image: `${config.publicUrl}/images/artist_iyasu.jpg`,
        soundcloud: "https://soundcloud.com/iyasubassproduction",
    },
    {
        name: "glich",
        description: "",
        image: `${config.publicUrl}/images/artist_glich.jpg`,
        soundcloud: "https://soundcloud.com/glichofficial",
    },
    {
        name: "ghostbow",
        description: "Multi instrumental, genre hopping beats that will haunt you",
        image: `${config.publicUrl}/images/ghostbow.jpeg`,
        soundcloud: "https://soundcloud.com/jeffwestcott",
    },
    {
        name: "spru",
        description: "",
        image: "https://picsum.photos/seed/artist8/150",
    },

];


export default function Artists() {
    return (
        <section>
            <div className="artist-list">
                {artists.map((artist, index) => (
                    <div key={artist.name} className={`artist-row ${index % 2 === 0 ? 'left' : 'right'}`}>
                        <div className="artist-image-container">
                            <img src={artist.image} alt={artist.name} className="artist-image" />
                            {artist.soundcloud && (
                                <a href={artist.soundcloud} target="_blank" rel="noopener noreferrer" className="soundcloud-overlay">
                                    <img 
                                        src={`${config.publicUrl}/images/soundcloudLogo.png`}
                                        alt="Soundcloud" 
                                        className="soundcloud-icon" 
                                    />
                                </a>
                            )}
                        </div>
                        <div className="artist-info">
                            <div className="artist-name">{artist.name}</div>
                            <div className="artist-description">{artist.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

