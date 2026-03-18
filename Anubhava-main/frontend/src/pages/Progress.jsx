import React from 'react';
import { useQuery } from '@apollo/client/react';
import { Card, Row, Col, Typography, Spin, Alert, Timeline, Tag, Progress as AntdProgress, Statistic } from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  CheckCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { MY_PROGRESS } from '../graphql/progress';

const { Title, Text } = Typography;

const Progress = () => {
  const { data, loading, error } = useQuery(MY_PROGRESS);

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

  const progress = data?.myProgress;

  if (!progress) {
    return <Alert message="No progress data available" type="info" showIcon />;
  }
  console.log(progress);
  return (
    <div className="space-y-6">
      <Title level={2}>Your Learning Progress</Title>

      {/* Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completion"
              value={progress.completionPercentage}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
                <AntdProgress
                  percent={progress.completionPercentage}
              strokeColor="#52c41a"
              showInfo={false}
              className="mt-2"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current Streak"
              value={progress.streak?.current || 0}
              suffix="days"
              prefix={<FireOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Text type="secondary" className="block mt-2">
              Longest: {progress.streak?.longest || 0} days
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Modules"
              value={progress.completedModules?.length || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary" className="block mt-2">
              Completed
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Current Status */}
      {progress.currentModule && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <RocketOutlined />
              <span>Current Module</span>
            </div>
          }
        >
          <Title level={4}>{progress.currentModule.title}</Title>
          <Text type="secondary">{progress.currentModule.description}</Text>
              <AntdProgress
                percent={Math.round(progress.currentModule.progress || 0)}
            status="active"
            className="mt-4"
          />
          {progress.currentLesson && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <Text strong>Current Lesson:</Text>
              <br />
              <Text>{progress.currentLesson.title}</Text>
            </div>
          )}
        </Card>
      )}

      {/* Completed Modules */}
      {progress.completedModules && progress.completedModules.length > 0 && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <CheckCircleOutlined />
              <span>Completed Modules</span>
            </div>
          }
        >
          <Timeline
            items={progress.completedModules.map((module) => ({
              children: (
                <div>
                  <Text strong>{module.moduleName || `Module ${module.moduleId}`}</Text>
                  {module.score !== null && module.score !== undefined && (
                    <>
                      <br />
                      <Tag color="green">Score: {module.score}%</Tag>
                    </>
                  )}
                  <br />
                </div>
              ),
              color: 'green',
            }))}
          />
        </Card>
      )}

      {/* Recent Activity */}
      {progress.completedLessons && progress.completedLessons.length > 0 && (
        <Card title="Recent Lessons">
          <Timeline
            items={progress.completedLessons
              .slice(-10)
              .reverse()
              .map((lesson) => ({
                children: (
                  <div>
                    <Text strong>{lesson.lessonName || `Lesson ${lesson.lessonId}`}</Text>
                    <br />
                  </div>
                ),
                color: 'blue',
              }))}
          />
        </Card>
      )}
    </div>
  );
};

export default Progress;