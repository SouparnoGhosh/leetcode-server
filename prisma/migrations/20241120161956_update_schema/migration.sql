/*
  Warnings:

  - You are about to drop the column `language` on the `Submission` table. All the data in the column will be lost.
  - Added the required column `language_id` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `Submission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `UserProgress` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('Accepted', 'WrongAnswer', 'SyntaxError', 'CompilationError', 'RuntimeError', 'TimeLimitExceeded', 'MemoryLimitExceeded', 'SecurityViolation');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('Attempted', 'Solved');

-- AlterEnum
ALTER TYPE "FailureReason" ADD VALUE 'WrongAnswer';

-- AlterTable
ALTER TABLE "Language" ADD COLUMN     "extensions" TEXT[];

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "language",
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "language_id" INTEGER NOT NULL,
ADD COLUMN     "totalTestCases" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "SubmissionStatus" NOT NULL;

-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "isSample" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserProgress" DROP COLUMN "status",
ADD COLUMN     "status" "ProgressStatus" NOT NULL;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
