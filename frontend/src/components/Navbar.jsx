import { Link, useLocation } from 'react-router-dom';
import { FiCpu, FiHome, FiPlusCircle } from 'react-icons/fi';
import './Navbar.css';

export default function Navbar() {
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                <Link to="/" className="navbar-brand">
                    <FiCpu className="brand-icon" />
                    <span className="brand-text">
                        AI <span className="text-gradient">Interviewer</span>
                    </span>
                </Link>

                <div className="navbar-links">
                    <Link
                        to="/"
                        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                    >
                        <FiHome />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/setup" className="btn btn-primary nav-cta">
                        <FiPlusCircle />
                        <span>New Interview</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
