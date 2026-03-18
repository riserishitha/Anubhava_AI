import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, Alert, Button, Progress, Tag, Divider, Timeline, message } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { GET_MODULE } from '../graphql/roadmap';
import { MARK_LESSON_COMPLETE } from '../graphql/progress';

const { Title, Text, Paragraph } = Typography;

const ModuleDetail = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [markLessonComplete] = useMutation(MARK_LESSON_COMPLETE);
  
  const { data, loading, error, refetch } = useQuery(GET_MODULE, {
    variables: { id: moduleId },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error.message}
        type="error"
        showIcon
      />
    );
  }

  const module = data?.getModule;

  if (!module) {
    return <Alert message="Module not found" type="warning" showIcon />;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'processing';
      default:
        return 'default';
    }
  };

  const handleCompleteLesson = async (lessonId) => {
    try {
      await markLessonComplete({
        variables: {
          input: {
            lessonId,
          },
        },
      });
      message.success('Lesson marked as complete!');
      refetch();
    } catch (err) {
      message.error('Failed to mark lesson as complete');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/roadmap')}
      >
        Back to Roadmap
      </Button>

      <Card>
        <Title level={2}>{module.title}</Title>
        <Paragraph>{module.description}</Paragraph>

        <div className="flex gap-4 mt-4">
          <Tag color="blue" className="capitalize">
            {module.difficulty?.toLowerCase()}
          </Tag>
          <Tag icon={<ClockCircleOutlined />}>
            {module.estimatedHours} hours
          </Tag>
          <Tag color={getStatusColor(module.status)}>
            {module.status}
          </Tag>
        </div>

        <Divider />

        <div className="mb-6">
          <Text strong>Module Progress</Text>
          <Progress
            percent={Math.round(module.progress || 0)}
            status={module.status === 'COMPLETED' ? 'success' : 'active'}
          />
        </div>

        {module.learningObjectives && module.learningObjectives.length > 0 && (
          <div className="mb-6">
            <Title level={5}>Learning Objectives</Title>
            <ul className="ml-4">
              {module.learningObjectives.map((objective, index) => (
                <li key={index} className="mb-2">
                  <Text>{objective}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {module.lessons && module.lessons.length > 0 && (
        <Card title={<Title level={4}>Lessons</Title>}>
          <Timeline
            items={module.lessons.map((lesson) => ({
              dot:
                lesson.status === 'COMPLETED' ? (
                  <CheckCircleOutlined className="text-green-500" />
                ) : lesson.status === 'IN_PROGRESS' ? (
                  <PlayCircleOutlined className="text-blue-500" />
                ) : (
                  <ClockCircleOutlined className="text-gray-400" />
                ),
              children: (
                <Card
                  size="small"
                  className="mb-4"
                  title={
                    <div className="flex items-center justify-between">
                      <Text strong>{lesson.title}</Text>
                      <Tag color={getStatusColor(lesson.status)}>
                        {lesson.status}
                      </Tag>
                    </div>
                  }
                >
                  <Paragraph>{lesson.description}</Paragraph>
                  
                  <div className="flex gap-4 mb-3">
                    <Text type="secondary">
                      <ClockCircleOutlined /> {lesson.estimatedMinutes} minutes
                    </Text>
                    <Text type="secondary" className="capitalize">
                      {lesson.difficulty?.toLowerCase()}
                    </Text>
                    <Tag>{lesson.contentType}</Tag>
                  </div>

                  {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
                    <div className="mb-3">
                      <Text strong className="text-sm">Learning Objectives:</Text>
                      <ul className="ml-4 mt-1">
                        {lesson.learningObjectives.map((obj, idx) => (
                          <li key={idx} className="text-sm text-gray-600">
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
                    <div className="mb-3">
                      <Text strong className="text-sm">Key Takeaways:</Text>
                      <ul className="ml-4 mt-1">
                        {lesson.keyTakeaways.map((takeaway, idx) => (
                          <li key={idx} className="text-sm text-gray-600">
                            {takeaway}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleCompleteLesson(lesson.id)}
                    disabled={lesson.status === 'COMPLETED'}
                    style={{ backgroundColor: lesson.status === 'COMPLETED' ? '#808080' : '#07523e'}}
                  >
                    {lesson.status === 'COMPLETED' ? 'Unit Completed' : 'Complete Unit'}
                  </Button>
                </Card>
              ),
            }))}
          />
        </Card>
      )}
    </div>
  );
};

export default ModuleDetail;