import { Link } from 'react-router-dom';
export default function Settings() {
    return (
        <div className="screen">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h1 className="page-title">Settings</h1>
                <p className="subtle">Manage your account preferences and profile redirects.</p>
              </div>
            </div>

            <div className="section-card settings-links">
              <Link to="/profile" className="text-link">Go to Profile</Link>
              <Link to="/" className="text-link">Go to Home</Link>
            </div>
          </div>
        </div>
    );
}
