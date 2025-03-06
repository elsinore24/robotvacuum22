import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function deployFunction() {
  try {
    // Load environment variables
    const envPath = path.join(__dirname, '../.env');
    const envResult = dotenv.config({ path: envPath });
    
    if (envResult.error) {
      throw new Error('Could not load .env file');
    }

    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Missing required Supabase environment variables');
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Read function code
    const functionPath = path.join(__dirname, '../supabase/functions/amazon-pa-api/index.ts');
    const functionCode = await fs.readFile(functionPath, 'utf-8');

    // Read config
    const configPath = path.join(__dirname, '../supabase/functions/amazon-pa-api/config.toml');
    const config = await fs.readFile(configPath, 'utf-8');

    // Read function environment variables
    const functionEnvPath = path.join(__dirname, '../supabase/functions/amazon-pa-api/.env');
    const functionEnvFile = await fs.readFile(functionEnvPath, 'utf-8');
    const functionEnv = Object.fromEntries(
      functionEnvFile.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.split('=').map(part => part.trim()))
    );

    console.log('Deploying function with configuration:', {
      url: process.env.VITE_SUPABASE_URL,
      hasKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      functionName: 'amazon-pa-api'
    });

    // Deploy function
    const response = await fetch(
      `${process.env.VITE_SUPABASE_URL}/functions/v1/deploy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'amazon-pa-api',
          code: functionCode,
          config,
          env: functionEnv
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to deploy function: ${errorText}`);
    }

    const result = await response.json();
    console.log('Function deployed successfully:', result);
  } catch (error) {
    console.error('Error deploying function:', error);
    process.exit(1);
  }
}

deployFunction();
