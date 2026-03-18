import React from 'react';
import { useQuery } from '@apollo/client/react';
import { Card, Typography, Spin, Alert, Empty, Button, Steps, Collapse, Tag, Progress } from 'antd';
import {
  RocketOutlined,
  CheckCircleOutlined,
  LockOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { MY_ROADMAP } from '../graphql/roadmap';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const Roadmap = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(MY_ROADMAP);

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

  const roadmap = data?.myRoadmap;

  if (!roadmap) {
    return (
      <div className="text-center py-12">
        <Empty
          description="No learning roadmap found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={() => navigate('/roadmap/create')}
          >
            Create Your Learning Roadmap
          </Button>
        </Empty>
      </div>
    );
  }

  const getModuleStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleOutlined className="text-green-500" />;
      case 'IN_PROGRESS':
        return <PlayCircleOutlined className="text-blue-500" />;
      case 'LOCKED':
        return <LockOutlined className="text-gray-900 bg-grey-900" />;
      default:
        return <ClockCircleOutlined className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'processing';
      case 'LOCKED':
        return 'default';
      default:
        return 'warning';
    }
  };

  return (
    <div className="space-y-6 mt-10">
      {/* Roadmap Header */}
      <Card style={{ marginBottom: 24 }}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Title level={2}>{roadmap.title}</Title>
            <Paragraph className="mt-2 ml-4 text-base font-medium leading-relaxed">{roadmap.description}</Paragraph>

            <div className="flex gap-4 mt-4">
              <Tag color="blue" className="capitalize">
                {roadmap.difficulty?.toLowerCase()}
              </Tag>
              <Tag icon={<ClockCircleOutlined />}>
                {roadmap.estimatedDuration?.weeks} weeks
              </Tag>
              <Tag color={getStatusColor(roadmap.status)}>{roadmap.status}</Tag>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Text strong>Overall Progress</Text>
          <Progress
            percent={Math.round(roadmap.completionPercentage || 0)}
            status="active"
            strokeColor={{
              "0%": "#108ee9",
              "100%": "#87d068",
            }}
          />
        </div>

        {roadmap.learningOutcomes && roadmap.learningOutcomes.length > 0 && (
          <div className="mt-6">
            <Text strong>Learning Outcomes:</Text>
            <ul className="mt-6 ml-4 leading-relaxed gap-6">
              {roadmap.learningOutcomes.map((outcome, index) => (
                <li key={index}>
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Modules */}
      <Card
        title={<Title level={4}>Modules</Title>}
      >
        <Steps
          direction="vertical"
          className="roadmap-steps"
          current={roadmap.modules?.findIndex(
            (m) => m.status === "IN_PROGRESS",
          )}
          items={roadmap.modules?.map((module) => ({
            title: (
              <div className="flex items-center gap-4 mb-5">
                {getModuleStatusIcon(module.status)}
                <Text strong>{module.title}</Text>
              </div>
            ),
            description: (
              <Card className="mt-2" size="small" style={{ borderColor: 'black'}}>
                <Paragraph>{module.description}</Paragraph>

                <div className="flex gap-4 mb-3">
                  <Text type="secondary">
                    <ClockCircleOutlined /> {module.estimatedHours} hours
                  </Text>
                  <Text type="secondary" className="capitalize">
                    {module.difficulty?.toLowerCase()}
                  </Text>
                  <Tag color={getStatusColor(module.status)}>
                    {module.status}
                  </Tag>
                </div>

                {module.status !== "LOCKED" && (
                  <>
                    <Progress
                      percent={Math.round(module.progress || 0)}
                      size="small"
                      strokeColor="#22c55e"
                      status={
                        module.status === "COMPLETED" ? "success" : "active"
                      }
                    />

                    {module.learningObjectives &&
                      module.learningObjectives.length > 0 && (
                        <Collapse
                          ghost
                          className="mt-3"
                          items={[
                            {
                              key: "1",
                              label: "Learning Objectives",
                              children: (
                                <ul className="ml-4">
                                  {module.learningObjectives.map((obj, idx) => (
                                    <li key={idx} className="text-gray-600">
                                      {obj}
                                    </li>
                                  ))}
                                </ul>
                              ),
                            },
                          ]}
                        />
                      )}

                    {module.lessons && module.lessons.length > 0 && (
                      <Collapse
                        ghost
                        className="mt-2"
                        items={[
                          {
                            key: "2",
                            label: `Lessons (${module.lessons.length})`,
                            children: (
                              <div className="space-y-2">
                                {module.lessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                  >
                                    <div className="flex-1">
                                      <Text>{lesson.title}</Text>
                                      <br />
                                      <Text
                                        type="secondary"
                                        className="text-sm"
                                      >
                                        {lesson.estimatedMinutes} min •{" "}
                                        {lesson.contentType}
                                      </Text>
                                    </div>
                                    <Tag color={getStatusColor(lesson.status)}>
                                      {lesson.status}
                                    </Tag>
                                  </div>
                                ))}
                              </div>
                            ),
                          },
                        ]}
                      />
                    )}

                    <Button
                      type="primary"
                      style={{ backgroundColor: '#16a34a'}}
                      disabled={module.status === "LOCKED"}
                      icon={
                        module.status === "COMPLETED" ? (
                          <CheckCircleOutlined />
                        ) : (
                          <PlayCircleOutlined />
                        )
                      }
                      onClick={() => navigate(`/roadmap/module/${module.id}`)}
                    >
                      {module.status === "COMPLETED"
                        ? "Review"
                        : "Start Module"}
                    </Button>
                  </>
                )}
              </Card>
            ),
            status:
              module.status === "COMPLETED"
                ? "finish"
                : module.status === "IN_PROGRESS"
                  ? "process"
                  : "wait",
          }))}
        />
      </Card>
    </div>
  );
};

export default Roadmap;