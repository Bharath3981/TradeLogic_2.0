/*
  Warnings:

  - You are about to drop the column `created_at` on the `strategy_modules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "strategy_modules" DROP COLUMN "created_at";

-- AddForeignKey
ALTER TABLE "strategy_module_configs" ADD CONSTRAINT "strategy_module_configs_module_key_fkey" FOREIGN KEY ("module_key") REFERENCES "strategy_modules"("module_key") ON DELETE RESTRICT ON UPDATE CASCADE;
