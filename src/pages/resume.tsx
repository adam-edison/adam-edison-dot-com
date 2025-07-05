import { PageLayout } from '@/components/layout/PageLayout';
import { ProfessionalSummary } from '@/components/resume/ProfessionalSummary';
import { WorkExperience } from '@/components/resume/WorkExperience';
import { PreviousExperience } from '@/components/resume/PreviousExperience';
import { Education } from '@/components/resume/Education';
import { Skills } from '@/components/resume/Skills';
import { DownloadButton } from '@/components/resume/DownloadButton';
import { experiences, skills, professionalSummary, previousExperience, education } from '@/data/resume';

export default function Resume() {
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <ProfessionalSummary summary={professionalSummary} />
        <WorkExperience experiences={experiences} />
        <PreviousExperience experiences={previousExperience} />
        <Education education={education} />
        <Skills skills={skills} />
        <DownloadButton />
      </div>
    </PageLayout>
  );
}
