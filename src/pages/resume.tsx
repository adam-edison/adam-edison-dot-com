import { HeaderBanner } from '@/components/layout/HeaderBanner';
import { MainHeader } from '@/components/layout/MainHeader';
import { ProfessionalSummary } from '@/components/resume/ProfessionalSummary';
import { WorkExperience } from '@/components/resume/WorkExperience';
import { PreviousExperience } from '@/components/resume/PreviousExperience';
import { Education } from '@/components/resume/Education';
import { Skills } from '@/components/resume/Skills';
import { DownloadButton } from '@/components/resume/DownloadButton';
import { experiences, skills, professionalSummary, previousExperience, education } from '@/data/resume';

export default function Resume() {
  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderBanner />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <MainHeader />
        <div className="max-w-5xl mx-auto">
          <ProfessionalSummary summary={professionalSummary} />
          <WorkExperience experiences={experiences} />
          <PreviousExperience experiences={previousExperience} />
          <Education education={education} />
          <Skills skills={skills} />
          <DownloadButton />
        </div>
      </div>
    </div>
  );
}
