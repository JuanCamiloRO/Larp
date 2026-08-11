import { Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../supabase';
export default function SignUp() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState('male');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [age, setAge] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate(); 
    console.log(username,email,height,weight,gender);
    console.log(password,confirmPassword,error);
    
    const handleSignUp = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        
        if (!email || !password || !username || !height || !weight || !gender ||!age) {
            setError('Please, fill all the fields')
            setLoading(false)
            return
        }
        if (!email.includes("@")){
          setError('Email in wrong format')
        }
        if (password.length < 8) {
            setError('Password must have at least 8 digits')
            setLoading(false)
            return
        }
        if (password !== confirmPassword) {
            setError("Passwords don't match")
            setLoading(false)
            return
        }
      

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    height: height,
                    weight: weight,
                    gender: gender,
                    age: age
                }
            }
        })

        if (error) {
            setError(error.message)
        } else {
            // Limpiar formulario
            setError('')
            setSuccess('Cuenta creada correctamente.')
            setUsername('')
            setWeight('')
            setHeight('')
            setEmail('')
            setPassword('')
            setConfirmPassword('')
            setGender('')
            setAge('')
            timeout(() => {
                navigate('/onboarding')
            }, 2000)
        }
        setLoading(false)
    }
  return (
    <div className="screen">
      <div className="panel">
        <div className="panel-header">
          <span className="brand">Larp</span>
          <Link to="/" className="icon-btn">←</Link>
        </div>
        <h1 className="page-title">Welcome</h1>
        <p className="subtle">Sign in to continue with your account and keep your profile updated.</p>

        <div className="form-grid">
          <input onChange={(e) => setUsername(e.target.value)} className="input-field" type="text" placeholder="Username" />
          <input onChange={(e) => setEmail(e.target.value)} className="input-field" type="email" placeholder="Email" />
          <input onChange={(e) => setPassword(e.target.value)} className="input-field" type="password" placeholder="Password" />
          <input onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" type="password" placeholder="Confirm password" />
        </div>

        <div className="form-row" style={{ marginBottom: '22px' }}>
          <input onChange={(e) => setAge(e.target.value)} className="input-field" type="number" placeholder="age" />
          <input onChange={(e) => setHeight(e.target.value)} className="input-field" type="number" placeholder="cm" />
          <input onChange={(e) => setWeight(e.target.value)} className="input-field" type="number" placeholder="kg" />
          <select onChange={(e) => setGender(e.target.value)} className="input-field">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        {error && <span style={{ color: 'red', marginTop: '10px' }} className="small-text">{error}</span>}
        {success && <span style={{ color: 'green', marginTop: '10px' }} className="small-text">{success}</span>}
          
        </div>

        <button onClick={handleSignUp} className="primary-btn">Sign Up</button>

        <p className="small-text">
          Already have an account? <Link to="/login" className="text-link">Log in</Link>
        </p>
      </div>
    </div>
  );
}
