// import React, { useState } from 'react';
// import { useLazyQuery, useMutation } from '@apollo/client/react';
// import { Card, Input, Button, Typography, Spin, Alert, Empty, Divider, Tag } from 'antd';
// import { SendOutlined, QuestionCircleOutlined, BulbOutlined } from '@ant-design/icons';
// import { ASK_QUESTION } from '../graphql/ai';
// import { RESOLVE_DOUBT } from '../graphql/ai';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;

// const AIAssistant = () => {
//   const [question, setQuestion] = useState('');
//   const [doubt, setDoubt] = useState('');
//   const [currentLessonId, setCurrentLessonId] = useState('');
//   const [mode, setMode] = useState('question'); // 'question' or 'doubt'

//   const [askQuestion, { data: questionData, loading: questionLoading, error: questionError }] =
//     useLazyQuery(ASK_QUESTION);

//   const [resolveDoubt, { data: doubtData, loading: doubtLoading, error: doubtError }] =
//     useMutation(RESOLVE_DOUBT);

//   const handleAskQuestion = () => {
//     if (!question.trim()) return;
//     askQuestion({
//       variables: {
//         input: {
//           question: question.trim(),
//           lessonId: currentLessonId || null,
//         },
//       },
//     });
//   };

//   const handleResolveDoubt = () => {
//     if (!doubt.trim()) return;
//     resolveDoubt({
//       variables: {
//         input: {
//           doubt: doubt.trim(),
//         },
//       },
//     });
//   };

//   const handleSubmit = () => {
//     if (mode === 'question') {
//       handleAskQuestion();
//     } else {
//       handleResolveDoubt();
//     }
//   };

//   const loading = questionLoading || doubtLoading;
//   const error = questionError || doubtError;
//   const explanation = questionData?.askQuestion;
//   const resolution = doubtData?.resolveDoubt;

//   return (
//     <div className="max-w-4xl mx-auto space-y-6">
//       <div className="text-center">
//         <Title level={2}>
//           <QuestionCircleOutlined className="mr-2" />
//           AI Learning Assistant
//         </Title>
//         <Text type="secondary">
//           Ask questions or get help resolving doubts about your learning content
//         </Text>
//       </div>

//       {/* Mode Selector */}
//       <Card>
//         <div className="flex gap-4 mb-4">
//           <Button
//             type={mode === 'question' ? 'primary' : 'default'}
//             onClick={() => setMode('question')}
//             icon={<QuestionCircleOutlined />}
//           >
//             Ask a Question
//           </Button>
//           <Button
//             type={mode === 'doubt' ? 'primary' : 'default'}
//             onClick={() => setMode('doubt')}
//             icon={<BulbOutlined />}
//           >
//             Resolve a Doubt
//           </Button>
//         </div>

//         {mode === 'question' ? (
//           <>
//             <TextArea
//               rows={4}
//               placeholder="Ask any question about your learning topics..."
//               value={question}
//               onChange={(e) => setQuestion(e.target.value)}
//               onPressEnter={(e) => {
//                 if (e.ctrlKey || e.metaKey) {
//                   handleAskQuestion();
//                 }
//               }}
//             />
//             <div className="mt-2">
//               <Button
//                 type="primary"
//                 icon={<SendOutlined />}
//                 onClick={handleAskQuestion}
//                 loading={loading}
//                 disabled={!question.trim()}
//                 block
//               >
//                 Ask Question
//               </Button>
//             </div>
//           </>
//         ) : (
//           <>
//             <TextArea
//               rows={4}
//               placeholder="Describe your doubt or confusion..."
//               value={doubt}
//               onChange={(e) => setDoubt(e.target.value)}
//               onPressEnter={(e) => {
//                 if (e.ctrlKey || e.metaKey) {
//                   handleResolveDoubt();
//                 }
//               }}
//             />
//             <Button
//               type="primary"
//               icon={<SendOutlined />}
//               onClick={handleResolveDoubt}
//               loading={loading}
//               disabled={!doubt.trim()}
//               block
//               className="mt-2"
//             >
//               Resolve Doubt
//             </Button>
//           </>
//         )}
//       </Card>

//       {/* Loading State */}
//       {loading && (
//         <Card>
//           <div className="flex items-center justify-center py-8">
//             <Spin size="large" />
//             <Text className="ml-4">AI is thinking...</Text>
//           </div>
//         </Card>
//       )}

//       {/* Error State */}
//       {error && (
//         <Alert
//           message="Error"
//           description={error.message}
//           type="error"
//           showIcon
//           closable
//         />
//       )}

//       {/* Question Response */}
//       {explanation && !loading && (
//         <Card title={<Title level={4}>AI Explanation</Title>}>
//           <Paragraph>{explanation.explanation}</Paragraph>

//           {explanation.examples && explanation.examples.length > 0 && (
//             <>
//               <Divider />
//               <Title level={5}>Examples:</Title>
//               <ul className="ml-4">
//                 {explanation.examples.map((example, index) => (
//                   <li key={index} className="mb-2">
//                     <Text>{example}</Text>
//                   </li>
//                 ))}
//               </ul>
//             </>
//           )}

//           {explanation.relatedConcepts && explanation.relatedConcepts.length > 0 && (
//             <>
//               <Divider />
//               <Title level={5}>Related Concepts:</Title>
//               <div className="flex flex-wrap gap-2">
//                 {explanation.relatedConcepts.map((concept, index) => (
//                   <Tag key={index} color="blue">
//                     {concept}
//                   </Tag>
//                 ))}
//               </div>
//             </>
//           )}

//           {explanation.furtherReading && explanation.furtherReading.length > 0 && (
//             <>
//               <Divider />
//               <Title level={5}>Further Reading:</Title>
//               <ul className="ml-4">
//                 {explanation.furtherReading.map((reading, index) => (
//                   <li key={index} className="mb-1">
//                     <Text type="secondary">{reading}</Text>
//                   </li>
//                 ))}
//               </ul>
//             </>
//           )}

//           {explanation.sources && explanation.sources.length > 0 && (
//             <>
//               <Divider />
//               <Title level={5}>Sources:</Title>
//               <div className="space-y-2">
//                 {explanation.sources.map((source, index) => (
//                   <div key={index} className="flex items-center gap-2">
//                     <Tag>Lesson: {source.lessonId}</Tag>
//                     <Text type="secondary">Relevance: {(source.relevance * 100).toFixed(0)}%</Text>
//                   </div>
//                 ))}
//               </div>
//             </>
//           )}
//         </Card>
//       )}

//       {/* Doubt Resolution Response */}
//       {resolution && !loading && (
//         <Card title={<Title level={4}>Doubt Resolution</Title>}>
//           <Paragraph>{resolution.answer}</Paragraph>

//           {resolution.examples && resolution.examples.length > 0 && (
//             <>
//               <Divider />
//               <Title level={5}>Examples:</Title>
//               <ul className="ml-4">
//                 {resolution.examples.map((example, index) => (
//                   <li key={index} className="mb-2">
//                     <Text>{example}</Text>
//                   </li>
//                 ))}
//               </ul>
//             </>
//           )}

//           {resolution.tips && resolution.tips.length > 0 && (
//             <>
//               <Divider />
//               <Title level={5}>Tips:</Title>
//               <ul className="ml-4">
//                 {resolution.tips.map((tip, index) => (
//                   <li key={index} className="mb-2">
//                     <Text type="warning">{tip}</Text>
//                   </li>
//                 ))}
//               </ul>
//             </>
//           )}

//           {resolution.nextSteps && resolution.nextSteps.length > 0 && (
//             <>
//               <Divider />
//               <Title level={5}>Next Steps:</Title>
//               <ul className="ml-4">
//                 {resolution.nextSteps.map((step, index) => (
//                   <li key={index} className="mb-2">
//                     <Text strong>{step}</Text>
//                   </li>
//                 ))}
//               </ul>
//             </>
//           )}
//         </Card>
//       )}

//       {/* Empty State */}
//       {!explanation && !resolution && !loading && !error && (
//         <Card>
//           <Empty
//             description="Ask a question or resolve a doubt to see AI-powered assistance"
//             image={Empty.PRESENTED_IMAGE_SIMPLE}
//           />
//         </Card>
//       )}
//     </div>
//   );
// };

// export default AIAssistant;

import React, { useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import {
  Card,
  Input,
  Button,
  Typography,
  Spin,
  Alert,
  Empty,
  Divider,
  Tag,
  ConfigProvider,
} from 'antd';
import {
  SendOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { ASK_QUESTION, RESOLVE_DOUBT } from '../graphql/ai';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const QUICK_PROMPTS = [
  'Explain this topic simply',
  'Give a real-world example',
  'Why does this concept matter?',
];

const AIAssistant = () => {
  const [question, setQuestion] = useState('');
  const [doubt, setDoubt] = useState('');
  const [currentLessonId, setCurrentLessonId] = useState('');
  const [mode, setMode] = useState('question');

  const [
    askQuestion,
    { data: questionData, loading: questionLoading, error: questionError },
  ] = useLazyQuery(ASK_QUESTION);

  const [
    resolveDoubt,
    { data: doubtData, loading: doubtLoading, error: doubtError },
  ] = useMutation(RESOLVE_DOUBT);

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    askQuestion({
      variables: {
        input: {
          question: question.trim(),
          lessonId: currentLessonId || null,
        },
      },
    });
  };

  const handleResolveDoubt = () => {
    if (!doubt.trim()) return;
    resolveDoubt({
      variables: {
        input: {
          doubt: doubt.trim(),
        },
      },
    });
  };

  const loading = questionLoading || doubtLoading;
  const error = questionError || doubtError;
  const explanation = questionData?.askQuestion;
  const resolution = doubtData?.resolveDoubt;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#07523e',
          borderRadius: 12,
        },
      }}
    >
      <div className="min-h-screen bg-[#f6f8f7] flex justify-center">
        <div className="w-full max-w-5xl px-4 py-10 space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
              alt="AI Chatbot"
              className="mx-auto w-24 h-24 opacity-90"
            />
            <Title level={2} style={{ marginBottom: 0 }}>
              Welcome to <span style={{ color: '#07523e' }}>ANUBHAVA.AI</span>
            </Title>
            <Text type="secondary">
              Learn deeply. Ask freely. Understand clearly.
            </Text>
          </div>

          {/* Mode Switch */}
          <div className="flex justify-center gap-3">
            <Button
              type={mode === 'question' ? 'primary' : 'default'}
              icon={<QuestionCircleOutlined />}
              onClick={() => setMode('question')}
            >
              Ask a Question
            </Button>
            <Button
              type={mode === 'doubt' ? 'primary' : 'default'}
              icon={<BulbOutlined />}
              onClick={() => setMode('doubt')}
            >
              Resolve a Doubt
            </Button>
          </div>

          {/* Suggestions */}
          <div className="flex justify-center flex-wrap gap-3">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() =>
                  mode === 'question'
                    ? setQuestion(prompt + ': ')
                    : setDoubt(prompt + ': ')
                }
                className="px-4 py-2 text-sm rounded-lg border border-[#2c6d58] text-[#2c6d58] hover:bg-[#e9f3ef]"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <Card className="shadow-sm">
            <TextArea
              rows={4}
              placeholder={
                mode === 'question'
                  ? 'Ask anything about your learning topic...'
                  : 'Describe what you are confused about...'
              }
              value={mode === 'question' ? question : doubt}
              onChange={(e) =>
                mode === 'question'
                  ? setQuestion(e.target.value)
                  : setDoubt(e.target.value)
              }
              onPressEnter={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  mode === 'question'
                    ? handleAskQuestion()
                    : handleResolveDoubt();
                }
              }}
              style={{
                borderRadius: 12,
                padding: 16,
              }}
            />

            <div className="flex justify-between items-center mt-3">
              <Text type="secondary">
                Ctrl / Cmd + Enter to submit
              </Text>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loading}
                disabled={
                  mode === 'question'
                    ? !question.trim()
                    : !doubt.trim()
                }
                onClick={
                  mode === 'question'
                    ? handleAskQuestion
                    : handleResolveDoubt
                }
              >
                Ask anubhava.ai
              </Button>
            </div>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="text-center py-6">
              <Spin size="large" />
              <div className="mt-2">
                <Text type="secondary">
                  anubhava.ai is thinking…
                </Text>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert
              type="error"
              showIcon
              closable
              message="Something went wrong"
              description={error.message}
            />
          )}

          {/* Question Response */}
          {explanation && !loading && (
            <Card title="AI Explanation" className="shadow-sm">
              <Paragraph>{explanation.explanation}</Paragraph>

              {explanation.examples?.length > 0 && (
                <>
                  <Divider />
                  <Title level={5}>Examples</Title>
                  <ul className="ml-4">
                    {explanation.examples.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </>
              )}

              {explanation.relatedConcepts?.length > 0 && (
                <>
                  <Divider />
                  <Title level={5}>Related Concepts</Title>
                  <div className="flex flex-wrap gap-2">
                    {explanation.relatedConcepts.map((c, i) => (
                      <Tag key={i} color="green">
                        {c}
                      </Tag>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}

          {/* Doubt Resolution */}
          {resolution && !loading && (
            <Card title="Doubt Resolution" className="shadow-sm">
              <Paragraph>{resolution.answer}</Paragraph>

              {resolution.tips?.length > 0 && (
                <>
                  <Divider />
                  <Title level={5}>Tips</Title>
                  <ul className="ml-4">
                    {resolution.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          )}

          {/* Empty */}
          {!explanation && !resolution && !loading && !error && (
            <Empty description="Start by asking something above" />
          )}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AIAssistant;