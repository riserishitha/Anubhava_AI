import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, RocketOutlined } from '@ant-design/icons';
import { useMutation } from '@apollo/client/react';
import { useNavigate, Link } from 'react-router-dom';
import { REGISTER } from '../graphql/auth';
import { useAuth } from '../context/AuthContext';

// const { Title, Text } = Typography;
const { TextArea } = Input;

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  const [register, { loading }] = useMutation(REGISTER, {
    onCompleted: (data) => {
      const user = data.register.user;
      login(data.register.token, user);
      navigate(
        user.baselineAssessmentCompleted
          ? '/dashboard'
          : '/assessment/baseline'
      );
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Registration failed. Please try again.');
    },
  });

  const onFinish = (values) => {
    setErrorMessage('');
    register({
      variables: {
        input: {
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          learningGoal: values.learningGoal,
        },
      },
    });
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-1">Create account</h2>
      <p className="text-gray-500 mb-6">
        Start your learning journey today
      </p>

      {errorMessage && (
        <div className="mb-4">
          <Alert
            message={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage('')}
          />
        </div>
      )}

      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
      >
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="firstName"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="First name"
              size="large"
              className="input"
            />
          </Form.Item>

          <Form.Item
            name="lastName"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Last name"
              size="large"
              className="input"
            />
          </Form.Item>
        </div>

        {/* Email */}
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email address"
            size="large"
            className="input"
          />
        </Form.Item>

          <Form.Item
            name="learningGoal"
            label="What do you want to learn?"
            rules={[
              { required: true, message: 'Please describe your learning goal!' },
              { min: 10, message: 'Please provide more details (at least 10 characters)' },
            ]}
          >
            <TextArea
              rows={3}
              prefix={<RocketOutlined />}
              placeholder="E.g., I want to learn full-stack web development with React and Node.js"
              size="large"
            />
          </Form.Item>

        {/* Password */}
        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 8, message: 'Password must be at least 8 characters!' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
            className="input"
          />
        </Form.Item>

        {/* Confirm Password */}
        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error('Passwords do not match!')
                );
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm password"
            size="large"
            className="input"
          />
        </Form.Item>

        <Button
          htmlType="submit"
          loading={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition"
        >
          Sign Up
        </Button>
      </Form>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-emerald-600 font-medium"
        >
          Sign in
        </Link>
      </p>
    </>
  );
};

export default Register;