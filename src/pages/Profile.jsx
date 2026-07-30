import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../supabase';
import "../style.css"

export default function Profile() {
  const { user } = useAuth();
  const { profile, loading } = useProfile();

  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setGender(profile.sex ?? '');
      setHeight(profile.height ?? '');
      setWeight(profile.weight ?? '');
      setAge(profile.age ?? '');
    }
  }, [profile]);

  const handleChange = (setter) => (e) => {
    setter(e.target.value);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        sex: gender,
        height: height,
        weight: weight,
        age: age,
      })
      .eq('id', profile?.id);

    if (error) {
      console.error('Failed to save profile:', error.message);
    } else {
      setEditing(false);
    }
    setSaving(false);
  };

  return (
    <div className="screen">
      <div className="panel">
        <div className="panel-header">
          <span className="brand">Larp</span>
        </div>
        <h1 className="page-title">My Profile</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p>Name: </p>
              <input
                className="edit-field"
                type="Text"
                value={username}
                onChange={handleChange(setUsername)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p>Age: </p>
              <input
                className="edit-field"
                type="number"
                value={age}
                onChange={handleChange(setAge)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p>Height: </p>
              <input
                className="edit-field"
                type="number"
                value={height}
                onChange={handleChange(setHeight)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p>Weight: </p>
              <input
                className="edit-field"
                type="number"
                value={weight}
                onChange={handleChange(setWeight)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p>Gender: </p>
              <input
                className="edit-field"
                type="text"
                value={gender}
                onChange={handleChange(setGender)}
              />
            </div>

            {editing ? (
              <button onClick={handleSave} className="primary-btn" disabled={saving} style={{ backgroundColor: 'blue' }}>
                {saving ? 'Saving...' : 'Done'}
              </button>
            ) : (
              <button className="primary-btn" disabled style={{ backgroundColor: 'gray' }}>Done</button>
            )}

            <Link to="/" className="primary-btn">Home</Link>
          </>
        )}
      </div>
    </div>
  );
}