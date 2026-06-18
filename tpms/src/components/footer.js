// src/components/Footer.js
import React from 'react';
import './footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            &copy; {currentYear} TPMS. All Rights Reserved.
        </footer>
    );
};

export default Footer;