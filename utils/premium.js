// utils/premium.js

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL;

export async function checkIfPremium(licenseKey) {
  try {
    const response = await axios.post(BACKEND_URL, { license_key: licenseKey });
    return { isPremium: response.data.success, email: response.data.email || '' };
  } catch (err) {
    return { isPremium: false };
  }
}
