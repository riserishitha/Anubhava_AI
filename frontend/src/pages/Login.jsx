import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useNavigate, Link } from 'react-router-dom';
import { LOGIN } from '../graphql/auth';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [errorMessage, setErrorMessage] = useState('');

  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      const user = data.login.user;
      authLogin(data.login.token, user);

      navigate(
        user.baselineAssessmentCompleted
          ? '/dashboard'
          : '/assessment/baseline'
      );
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Login failed. Please try again.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    login({
      variables: {
        input: {
          email: form.email,
          password: form.password,
        },
      },
    });
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-1">Welcome back</h2>
      <p className="text-gray-500 mb-6">Continue your learning journey</p>

      {errorMessage && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <input
          className="input mb-4 w-full"
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          required
        />

        {/* Password */}
        <input
          className="input mb-6 w-full"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="flex justify-between items-center mt-4 text-sm">
        <span className="text-gray-500 cursor-pointer hover:text-emerald-600">
          Forgot password?
        </span>
      </div>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Don’t have an account?{' '}
        <Link
          to="/register"
          className="text-emerald-600 font-medium"
        >
          Create an account
        </Link>
      </p>
    </>
  );
};

export default Login;