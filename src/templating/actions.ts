import chalk from 'chalk';
import { logger } from '../utils/logger';
import { getTemplateFiles } from './data';
import { writeFiles } from './filesystem';
import path from 'path';

export async function downloadTemplate(
  templateName: string,
  namespace: string,
  targetDirectory: string
): Promise<void> {
  try {
    const files = await getTemplateFiles(templateName);
    await writeFiles(files, targetDirectory, namespace);
    logger.info(
      chalk`{green SUCCESS} Downloaded new template into the "${namespace}" subdirectories.`
    );
    logger.info(
      `Check ${path.join(
        'readmes',
        namespace + '.md'
      )} for template instructions.`
    );
  } catch (err) {
    logger.error(err.message, err.name);
  }
}

export { fetchListOfTemplates } from './data';
