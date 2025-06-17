'use client';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testFetchLogin = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing login with fetch...');
      const response = await fetch('http://localhost:8001/api/accounts/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser2',
          password: 'testpassword123'
        })
      });
      
      console.log('Response received:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Login data:', data);
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Fetch test error:', error);
      setResult(`Fetch Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAxiosLogin = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing login with axios...');
      const axios = (await import('axios')).default;
      
      const response = await axios.post('http://localhost:8001/api/accounts/login/', {
        username: 'testuser2',
        password: 'testpassword123'
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      console.log('Axios response:', response.data);
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.error('Axios test error:', error);
      setResult(`Axios Error: ${error.message}\nCode: ${error.code}\nResponse: ${JSON.stringify(error.response?.data || 'No response data')}`);
    } finally {
      setLoading(false);
    }
  };

  const testServices = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing services API...');
      const response = await fetch('http://localhost:8001/api/bookings/services/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Services data:', data);
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Services test error:', error);
      setResult(`Services Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Test Page</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testServices}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Services API (Fetch)
          </button>
          
          <button
            onClick={testFetchLogin}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
          >
            Test Login API (Fetch)
          </button>
          
          <button
            onClick={testAxiosLogin}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 ml-4"
          >
            Test Login API (Axios)
          </button>
        </div>
        
        {loading && <p>Loading...</p>}
        
        {result && (
          <div className="bg-white p-4 rounded border">
            <h2 className="text-xl font-bold mb-4">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
