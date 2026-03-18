import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Card,
  Typography,
  Spin,
  Alert,
  Button,
  Radio,
  Input,
  message,
  Modal,
  Progress,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  GET_BASELINE_ASSESSMENT,
  GET_MODULE_ASSESSMENT,
  SUBMIT_ASSESSMENT,
  SUBMIT_ASSESSMENT_AND_GENERATE_ROADMAP,
} from '../graphql/assessment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const Assessment = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user, updateUser, logout, setIsQuizInProgress } = useAuth();
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  const isBaseline = moduleId === 'baseline';

  const { data, loading, error } = useQuery(
    isBaseline ? GET_BASELINE_ASSESSMENT : GET_MODULE_ASSESSMENT,
    {
      variables: isBaseline ? undefined : { moduleId },
      skip: !isBaseline && !moduleId,
    }
  );

  // Set quiz as in progress when component mounts
  useEffect(() => {
    setIsQuizInProgress(true);
    return () => {
      setIsQuizInProgress(false);
    };
  }, [setIsQuizInProgress]);

  // For baseline assessment: use combined mutation
  const [submitAssessmentAndGenerateRoadmap, { loading: submittingWithRoadmap }] = useMutation(
    SUBMIT_ASSESSMENT_AND_GENERATE_ROADMAP,
    {
      onCompleted: (data) => {
        setSubmitted(true);
        setGeneratingRoadmap(false);
        const result = data.submitAssessmentAndGenerateRoadmap.assessmentResult;
        
        localStorage.setItem('baselineResults', JSON.stringify(result));

        // Update user context
        updateUser?.({
          ...user,
          baselineAssessmentCompleted: true,
          skillLevel: result.recommendations?.skillLevel || user?.skillLevel,
        });

        // Navigate directly to dashboard - roadmap is already generated
        message.success('Your personalized learning roadmap has been created!');
        navigate('/dashboard');
      },
      onError: (error) => {
      
        setGeneratingRoadmap(false);
        message.error(error.message || 'Failed to generate roadmap');
      },
    }
  );

  // For module assessments: use regular mutation
  const [submitAssessment, { loading: submitting }] = useMutation(SUBMIT_ASSESSMENT, {
    onCompleted: (data) => {
      setSubmitted(true);
      const result = data.submitAssessment;
      
      // For module assessments, show standard result
      Modal.success({
        title: result.passed ? 'Congratulations!' : 'Assessment Complete',
        content: (
          <div>
            <Paragraph>
              Score: {result.score}/{result.totalQuestions}
            </Paragraph>
            <Paragraph>Percentage: {result.percentage.toFixed(2)}%</Paragraph>
            <Paragraph>{result.feedback}</Paragraph>
          </div>
        ),
        onOk: () => navigate('/roadmap'),
      });
    },
    onError: (error) => {
      message.error(error.message || 'Failed to submit assessment');
    },
  });

  const assessment = isBaseline ? data?.getBaselineAssessment : data?.getModuleAssessment;

  useEffect(() => {
    if (assessment?.timeLimit) {
      setTimeRemaining(assessment.timeLimit * 60); // Convert to seconds
    }
  }, [assessment]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitted]);

  // Show loading spinner while generating roadmap
  if (loading || generatingRoadmap) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spin size="large" />
        {generatingRoadmap && (
          <div className="text-center">
            <Text strong className="text-lg block mb-2">Generating Your Personalized Learning Roadmap</Text>
            <Text type="secondary">Please wait while our AI creates a customized learning path based on your assessment results...</Text>
          </div>
        )}
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

  if (!assessment) {
    return <Alert message="Assessment not found" type="warning" showIcon />;
  }

  if (!assessment.canAttempt) {
    return (
      <Alert
        message="Cannot Attempt Assessment"
        description="You have reached the maximum number of attempts for this assessment."
        type="warning"
        showIcon
        action={
          <Button onClick={() => navigate('/roadmap')}>
            Back to Roadmap
          </Button>
        }
      />
    );
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    const formattedAnswers = assessment.questions.map((q) => ({
      questionId: q.id,
      selectedOption: q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE' ? answers[q.id] : null,
      answer: q.type === 'SHORT_ANSWER' || q.type === 'CODE_SNIPPET' ? answers[q.id] : null,
    }));

    // For baseline assessment, use combined mutation and show loading state
    if (isBaseline) {
      setGeneratingRoadmap(true);
      submitAssessmentAndGenerateRoadmap({
        variables: {
          input: {
            assessmentId: assessment.id,
            answers: formattedAnswers,
            roadmapDuration: 12, // Default to 12 weeks
          },
        },
      });
    } else {
      // For module assessments, use regular mutation
      submitAssessment({
        variables: {
          input: {
            assessmentId: assessment.id,
            answers: formattedAnswers,
          },
        },
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = assessment.questions?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            // Clean onboarding flow: if baseline not done yet, don't send user into empty roadmap.
            // Give them an escape hatch (logout) instead of confusing navigation.
            if (isBaseline && !user?.baselineAssessmentCompleted) {
              logout();
              return;
            }
            navigate("/roadmap");
          }}
          disabled={submitting}
        >
          {isBaseline && !user?.baselineAssessmentCompleted ? "Logout" : "Back"}
        </Button>
        {timeRemaining !== null && (
          <div className="flex items-center gap-2">
            <ClockCircleOutlined
              className={timeRemaining < 300 ? "text-red-500" : ""}
            />
            <Text strong className={timeRemaining < 300 ? "text-red-500" : ""}>
              {formatTime(timeRemaining)}
            </Text>
          </div>
        )}
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Title level={2}>{assessment.title}</Title>
        {assessment.description && (
          <Paragraph>{assessment.description}</Paragraph>
        )}

        <div className="flex gap-4 mt-4 mb-4">
          <Text>
            <strong>Total Marks:</strong> {assessment.totalMarks}
          </Text>
          <Text>
            <strong>Passing Score:</strong> {assessment.passingScore}%
          </Text>
          <Text>
            <strong>Time Limit:</strong> {assessment.timeLimit} minutes
          </Text>
        </div>

        <Progress
          percent={(answeredCount / totalQuestions) * 100}
          format={() => `${answeredCount}/${totalQuestions} answered`}
          strokeColor="#22c55e"
        />
      </Card>

      <div className="space-y-4">
        {assessment.questions?.map((question, index) => (
          <Card
            style={{ marginBottom: 24 }}
            styles={{
              header: {
                backgroundColor: "#07523e",
                color: "#ffff",
                padding: "12px 16px",
              },
              body: {
                paddingTop: 16,
              },
            }}
            key={question.id}
            title={
              <div className="flex items-center justify-between bg-#047857">
                <Text strong style={{ color: "#ffffff" }}>Question {index + 1}</Text>
                <Text type="secondary" style={{ color: "#ffffff" }}>{question.points} points</Text>
              </div>
            }
          >
            <Paragraph>{question.question}</Paragraph>

            {question.type === "MULTIPLE_CHOICE" && (
              <Radio.Group
                onChange={(e) =>
                  handleAnswerChange(question.id, e.target.value)
                }
                value={answers[question.id]}
                className="w-full"
              >
                <div className="space-y-2">
                  {question.options?.map((option, idx) => (
                    <Radio key={idx} value={option} className="block">
                      {option}
                    </Radio>
                  ))}
                </div>
              </Radio.Group>
            )}

            {question.type === "TRUE_FALSE" && (
              <Radio.Group
                onChange={(e) =>
                  handleAnswerChange(question.id, e.target.value)
                }
                value={answers[question.id]}
              >
                <Radio value="True">True</Radio>
                <Radio value="False">False</Radio>
              </Radio.Group>
            )}

            {question.type === "SHORT_ANSWER" && (
              <TextArea
                rows={3}
                placeholder="Type your answer here..."
                onChange={(e) =>
                  handleAnswerChange(question.id, e.target.value)
                }
                value={answers[question.id]}
              />
            )}

            {question.type === "CODE_SNIPPET" && (
              <TextArea
                rows={6}
                placeholder="Write your code here..."
                onChange={(e) =>
                  handleAnswerChange(question.id, e.target.value)
                }
                value={answers[question.id]}
                className="font-mono"
              />
            )}
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between">
          <Text>
            You have answered {answeredCount} out of {totalQuestions} questions
          </Text>
          <Button
            type="primary"
            size="large"
            style={{backgroundColor: answeredCount < totalQuestions? '#a6aaa9':'#07523e', color:'white'}}
            icon={<CheckCircleOutlined />}
            onClick={handleSubmit}
            loading={submitting || submittingWithRoadmap}
            disabled={answeredCount < totalQuestions}
          >
            {isBaseline ? "Submit & Generate Roadmap" : "Submit Assessment"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Assessment;