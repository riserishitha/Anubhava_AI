import React, { useState } from 'react';
import { Form, Input, Button, Card, Select, InputNumber, Typography, message } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { GENERATE_ROADMAP } from '../graphql/roadmap';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateRoadmap = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);

  const [generateRoadmap] = useMutation(GENERATE_ROADMAP, {
    onCompleted: (data) => {
      setGenerating(false);
      message.success('Your learning roadmap has been created!');
      navigate(`/roadmap`);
    },
    onError: (error) => {
      setGenerating(false);
      message.error(error.message || 'Failed to generate roadmap');
    },
  });

  const onFinish = (values) => {
    setGenerating(true);
    generateRoadmap({
      variables: {
        input: {
          learningGoal: values.learningGoal,
          skillLevel: values.skillLevel,
          duration: values.duration,
        },
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="text-center mb-6">
          <RocketOutlined className="text-5xl text-blue-500 mb-4" />
          <Title level={2}>Create Your Learning Roadmap</Title>
          <Paragraph type="secondary">
            Tell us about your learning goals and we'll create a personalized roadmap for you
          </Paragraph>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            name="learningGoal"
            label="What do you want to learn?"
            rules={[
              { required: true, message: 'Please describe your learning goal' },
              { min: 10, message: 'Please provide more details (at least 10 characters)' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="E.g., I want to learn full-stack web development with React and Node.js"
            />
          </Form.Item>

          <Form.Item
            name="skillLevel"
            label="Your Current Skill Level"
            rules={[{ required: true, message: 'Please select your skill level' }]}
          >
            <Select placeholder="Select your skill level" size="large">
              <Option value="BEGINNER">Beginner - I'm just starting out</Option>
              <Option value="INTERMEDIATE">Intermediate - I have some experience</Option>
              <Option value="ADVANCED">Advanced - I'm experienced but want to deepen knowledge</Option>
              <Option value="EXPERT">Expert - I want to master advanced topics</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="duration"
            label="Desired Duration (in weeks)"
            rules={[
              { required: true, message: 'Please specify the duration' },
              { type: 'number', min: 1, max: 52, message: 'Duration must be between 1 and 52 weeks' },
            ]}
          >
            <InputNumber
              min={1}
              max={52}
              size="large"
              className="w-full"
              placeholder="How many weeks do you want to spend?"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={generating}
              icon={<RocketOutlined />}
            >
              {generating ? 'Generating Your Roadmap...' : 'Generate Roadmap'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateRoadmap;