import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Events from './components/features/events/Events';
import Artists from './components/features/artists/Artists';
import About from './components/features/about/About';
import Socials from './components/features/socials/Socials';
import LoungeChecklist from './components/features/loungeChecklist/LoungeChecklist';
import config from './config/env';

function App() {
    return (
        <Router basename={config.routerBase}>
            <Layout>
                <Routes>
                    <Route path="/" element={<Events />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/artists" element={<Artists />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/socials" element={<Socials />} />
                    <Route path="/checklist" element={<LoungeChecklist />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
