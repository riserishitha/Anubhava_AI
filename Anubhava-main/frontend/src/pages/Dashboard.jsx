import React from 'react';
import { useQuery } from '@apollo/client/react';
import { Row, Col, Progress, Button, Typography, Spin, Alert, Empty } from 'antd';
import {
  RocketOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { MY_ROADMAP } from '../graphql/roadmap';
import { MY_PROGRESS } from '../graphql/progress';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [baselineResults, setBaselineResults] = React.useState(null);

  const { data: roadmapData, loading: roadmapLoading, error: roadmapError } = useQuery(MY_ROADMAP);
  const { data: progressData, loading: progressLoading, error: progressError } = useQuery(MY_PROGRESS);

  const roadmap = roadmapData?.myRoadmap;

  React.useEffect(() => {
    const stored = localStorage.getItem('baselineResults');
    if (stored) {
      try {
        setBaselineResults(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse baseline results', e);
      }
    }
  }, []);

  if (roadmapLoading || progressLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Spin size="large" /></div>;
  }

  if (roadmapError || progressError) {
    return <Alert message="Error" description={roadmapError?.message || progressError?.message} type="error" showIcon />;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-12">
      {/* 1. Header Banner & Overlapping Card Container */}
<div className="relative mb-24 mt-4"> {/* Large margin-bottom to make room for the overlap */}
  {/* The Big Green Card Holder */}
  <div className="bg-[#064e3b] rounded-3xl p-10 h-[280px] text-white relative overflow-hidden shadow-lg">
    <div className="relative z-10 h-full flex flex-col justify-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4 opacity-70">Online Course</p>
      <div className='flex gap-50'>
      <h2 className="text-4xl font-bold max-w-md leading-[1.2] mb-8">
        Sharpen Your Skills with Professional Online Courses
      </h2>
      <h2 className="text-3xl font-bold max-w-md leading-[1.2] mb-8">
      Welcome back, {user?.firstName}! 👋
      </h2>
      </div>
      <button 
        onClick={() => navigate('/roadmap')}
        className="bg-white text-[#064e3b] px-7 py-3 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-emerald-50 transition-all w-fit shadow-md"
      >
        View Your Personalized Path <RightOutlined className="text-[10px]" />
      </button>
    </div>
    <div className="absolute right-[25%] top-1/2 -translate-y-1/2 text-white/5 pointer-events-none">
      <div className="text-[160px] font-thin">✦</div>
    </div>
  </div>

  {/* 2. Floating Assessment Card - Overlapping the bottom edge */}
  {baselineResults && (
    <div className="absolute -bottom-16 right-10 z-20 w-[340px] hidden lg:block m-10">
      <div className="bg-white rounded-[24px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-1 mt-5">
              Your Level
            </Text>
            <Title level={3} className="!m-0 !text-[#1e293b] !font-black !text-2xl">
              {baselineResults?.recommendations?.skillLevel || "BEGINNER"}
            </Title>
            <Button 
                type="link" 
                className="text-blue-500 text-[11px] p-0 h-auto mt-2 font-bold" 
                onClick={() => setBaselineResults(null)}
            >
                
            </Button>
          </div>
          <Progress
            type="circle"
            percent={baselineResults.percentage || 20}
            width={65}
            strokeColor="#3b82f6"
            strokeWidth={12}
            format={(p) => <span className="text-[12px] font-bold text-slate-800">{p}%</span>}
          />
        </div>
      </div>
    </div>
  )}
</div>

{/* 3. External Recommendations Section - Located Below the Banner */}
{baselineResults && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 px-2">
    {/* Areas to Improve */}
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-orange-100 text-orange-600 p-2 rounded-lg font-bold text-xs uppercase">Improve</div>
        <Text strong className="text-slate-500 uppercase text-[11px] tracking-wider">Areas to Improve</Text>
      </div>
      <div className="flex flex-wrap gap-2">
        {baselineResults.recommendations.weaknesses.map((w, i) => (
          <span key={i} className="text-[#9a3412] bg-[#fff7ed] px-3 py-1.5 rounded-lg text-[12px] font-bold border border-[#ffedd5]">
            {w}
          </span>
        ))}
      </div>
    </div>

    {/* Recommended Modules */}
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg font-bold text-xs uppercase">Next Up</div>
        <Text strong className="text-slate-500 uppercase text-[11px] tracking-wider">Recommended Modules</Text>
      </div>
      <div className="flex flex-wrap gap-2">
        {baselineResults.recommendations.suggestedModules.map((m, i) => (
          <span key={i} className="px-3 py-1.5 bg-[#eff6ff] text-[#1e40af] rounded-lg text-[12px] font-bold border border-[#dbeafe]">
            {m}
          </span>
        ))}
      </div>
    </div>
  </div>
)}

      {/* 3. Welcome and Bottom Content */}
      <div className="mt-12 px-2">

        {roadmap && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <RocketOutlined className="text-blue-500" />
              <Title level={4} className="!m-0">Current Learning Path</Title>
            </div>
            
            <Title level={5}>{roadmap.title}</Title>
            <Paragraph className="text-slate-500 text-sm mb-6">{roadmap.description}</Paragraph>

            {roadmap.currentModule && (
              <div className="p-4 bg-blue-50 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1 w-full">
                  <Text className="text-blue-500 font-bold text-[10px] uppercase">Current Module</Text>
                  <Title level={5} className="!mt-1 !mb-2">{roadmap.currentModule.title}</Title>
                  <Progress percent={Math.round(roadmap.currentModule.progress || 0)} strokeColor="#3b82f6" size="small" />
                </div>
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => navigate(`/roadmap/module/${roadmap.currentModule.id}`)}
                  className="rounded-lg font-bold h-10 px-6"
                >
                  Continue
                </Button>
              </div>
            )}
            
            {/* <Button 
              type="primary" 
              block 
              className="mt-6 h-11 rounded-xl bg-blue-600 font-bold shadow-lg shadow-blue-100"
              onClick={() => navigate('/roadmap')}
            >
              View Full Personalized Learning Path
            </Button> */}
            <Button type="primary" block className="!bg-[#064e3b] !text-white mt-6 h-11 rounded-xl font-bold shadow-lg shadow-blue-100" onClick={() => navigate('/roadmap')} > View Full Personalized Learning Path </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
