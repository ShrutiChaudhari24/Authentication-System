import express  from 'express'; // yaha humney express ko initialize kiya
import morgan from 'morgan';
import authRouter from './routes/auth.routes.js';

const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRouter); // auth router ki help sae jitni bhi api hum create karenge unka prefix /api/auth hoga. jaise ki humne login api create ki hai to uska url hoga /api/auth/login

export default app;