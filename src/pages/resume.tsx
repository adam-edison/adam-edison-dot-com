import { PageLayout } from '@/shared/components/layout/PageLayout';
import { ProfessionalSummary } from '@/features/resume/components/ProfessionalSummary';
import { WorkExperience } from '@/features/resume/components/WorkExperience';
import { PreviousExperience } from '@/features/resume/components/PreviousExperience';
import { Education } from '@/features/resume/components/Education';
import { Skills } from '@/features/resume/components/Skills';
import { DownloadButton } from '@/features/resume/components/DownloadButton';
import { experiences, skills, professionalSummary, previousExperience, education } from '@/features/resume/resume-data';

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
