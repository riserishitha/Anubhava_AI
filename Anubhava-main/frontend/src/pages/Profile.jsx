import React from 'react';
import { useMutation } from '@apollo/client/react';
import { Form, Input, Button, Card, Select, InputNumber, Typography, message, Avatar, Divider, Tag } from 'antd';
import { CameraOutlined, EditOutlined } from '@ant-design/icons';
import { UPDATE_PROFILE, ME } from '../graphql/auth';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const Profile = () => {
  const [form] = Form.useForm();
  const { user, updateUser } = useAuth();

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: ME }],
    onCompleted: (data) => {
      updateUser(data.updateProfile);
      message.success('Profile updated successfully!');
    },
    onError: (error) => {
      message.error(error.message || 'Failed to update profile');
    },
  });

  const onFinish = (values) => {
    updateProfile({
      variables: {
        input: {
          firstName: values.firstName,
          lastName: values.lastName,
          learningGoals: values.learningGoals,
          skillLevel: values.skillLevel,
          preferences: {
            learningPace: values.learningPace,
            dailyGoalMinutes: values.dailyGoalMinutes,
            emailNotifications: values.emailNotifications,
          },
        },
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gray-50 min-h-screen">
      <div className="mb-10">
        <Title level={4} className="!text-slate-700">My Profile</Title>
      </div>

      {/* Header Card: Avatar & Basic Info */}
      <Card className="mb-10 shadow-sm border-none rounded-xl py-4">
        <div className="flex items-center gap-8">
          <div className="relative">
            <Avatar 
              size={110} 
              className="border-2 border-gray-100 shadow-sm"
            />
            <Button 
              shape="circle" 
              size="small" 
              icon={<CameraOutlined className="text-xs" />} 
              className="absolute bottom-1 right-1 flex items-center justify-center bg-white shadow-md border-gray-200"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Title level={2} className="!mb-0">{user?.firstName} {user?.lastName}</Title>
            <Text type="secondary" className="text-lg font-medium">{user?.skillLevel || 'Beginner'}</Text>
          </div>
        </div>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
          learningGoals: user?.learningGoals,
          skillLevel: user?.skillLevel,
          learningPace: user?.preferences?.learningPace || 'MODERATE',
          dailyGoalMinutes: user?.preferences?.dailyGoalMinutes || 30,
          emailNotifications: user?.preferences?.emailNotifications ?? true,
        }}
        requiredMark={false}
      >
        {/* Personal Information Card */}
        <Card 
          className="mb-10 shadow-sm border-none rounded-xl"
          title={<span className="text-slate-700 font-bold text-lg">Personal Information</span>}
          extra={<Button type="text" icon={<EditOutlined />} className="text-orange-500 font-medium bg-orange-50">Edit</Button>}
        >
          {/* Increased grid gap-y for more vertical space between form items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-12 py-4">
            <Form.Item name="firstName" label={<Text type="secondary">First Name</Text>} className="mb-0">
              <Input variant="borderless" className="px-0 font-medium text-base" />
            </Form.Item>
            <Form.Item name="lastName" label={<Text type="secondary">Last Name</Text>} className="mb-0">
              <Input variant="borderless" className="px-0 font-medium text-base" />
            </Form.Item>
            <Form.Item name="email" label={<Text type="secondary">Email Address</Text>} className="mb-0">
              <Input variant="borderless" disabled className="px-0 font-medium text-base !text-slate-900" />
            </Form.Item>
            <Form.Item name="skillLevel" label={<Text type="secondary">User Role / Skill</Text>} className="mb-0">
              <Select variant="borderless" className="px-0 font-medium text-base w-full">
                <Option value="BEGINNER">Beginner</Option>
                <Option value="INTERMEDIATE">Intermediate</Option>
                <Option value="ADVANCED">Advanced</Option>
              </Select>
            </Form.Item>
          </div>
        </Card>

        {/* Learning Preferences Card */}
        <Card 
          className="mb-10 shadow-sm border-none rounded-xl"
          title={<span className="text-slate-700 font-bold text-lg">Learning Preferences</span>}
        >
          {/* Increased grid gap-y for more vertical space between form items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-16 py-4">
            <Form.Item name="learningGoals" label={<Text type="secondary">Learning Goals</Text>} className="mb-0">
              <Select 
                mode="tags" 
                variant="borderless" 
                placeholder="Add goals" 
                className="px-0 font-medium text-base"
                tagRender={({ label, closable, onClose }) => (
                  <Tag closable={closable} onClose={onClose} color="blue" className="rounded-full px-3 py-0.5">
                    {label}
                  </Tag>
                )}
              >
                <Option value="Python">Python</Option>
                <Option value="Javascript">Javascript</Option>
                <Option value="React">React</Option>
              </Select>
            </Form.Item>

            <Form.Item name="learningPace" label={<Text type="secondary">Learning Pace</Text>} className="mb-0">
              <Select variant="borderless" className="px-0 font-medium text-base w-full">
                <Option value="SLOW">Slow - Take my time</Option>
                <Option value="MODERATE">Moderate - Steady progress</Option>
                <Option value="FAST">Fast - Quick learning</Option>
              </Select>
            </Form.Item>

            <Form.Item name="dailyGoalMinutes" label={<Text type="secondary">Daily Goal (Minutes)</Text>} className="mb-0">
              <InputNumber variant="borderless" className="px-0 font-medium text-base w-full" />
            </Form.Item>

            <Form.Item name="emailNotifications" label={<Text type="secondary">Email Notifications</Text>} className="mb-0">
              <Select variant="borderless" className="px-0 font-medium text-base w-full">
                <Option value={true}>Enabled</Option>
                <Option value={false}>Disabled</Option>
              </Select>
            </Form.Item>
          </div>
          
          <Divider className="my-10" />
          
          <div className="flex justify-end pb-4">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="bg-orange-500 hover:!bg-orange-600 border-none px-12 h-12 rounded-lg font-bold text-base"
            >
              Update Profile
            </Button>
          </div>
        </Card>
      </Form>
    </div>
  );
};

export default Profile;