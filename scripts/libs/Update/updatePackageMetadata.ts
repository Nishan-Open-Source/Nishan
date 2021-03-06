import colors from 'colors';
import fs from 'fs';
import path from 'path';
import remark from 'remark';
import dedent from 'ts-dedent';
import packages_data from '../../packages.json';
import { createReadme } from '../Create/createReadme';
import { updatePackageDescription } from './updatePackageDescription';

export async function updatePackageMetadata () {
	const docs_dir = path.resolve(__dirname, '../../../../docs/docs'),
		packages_dir = path.resolve(__dirname, '../../../../packages'),
		root_readme_path = path.resolve(__dirname, '../../../../README.md'),
		root_readme_text = await fs.promises.readFile(root_readme_path, 'utf-8'),
		parsed_root_readme_md: any = remark().parse(root_readme_text);

	let total_published_packages = 0,
		packages_readme_text = ``;
	const docs_dirs = await fs.promises.readdir(docs_dir);

	for (let index = 0; index < packages_data.length; index++) {
		packages_data[index].name = packages_data[index].name.split('/')[1];
		const package_data = packages_data[index],
			{ name } = package_data,
			package_dir = path.join(packages_dir, name),
			package_readme_path = path.join(package_dir, 'README.md'),
			package_json_path = path.join(package_dir, 'package.json');
		await createReadme(package_readme_path, name, package_data.description);
		await updatePackageDescription(package_json_path, package_data.description);
		const github_link = ` [Github](https://github.com/Devorein/Nishan/tree/master/packages/${name})`,
			doc_link = docs_dirs.includes(name) ? ` [Docs](https://nishan-docs.netlify.app/docs/${name})` : '',
			npm_link = package_data.published ? ` [NPM](https://www.npmjs.com/package/@nishans/${name})` : '';
		total_published_packages += package_data.published ? 1 : 0;
		packages_readme_text += `* **\`@nishans/${name}\`**${github_link}${doc_link}${npm_link}: ${package_data.description}\n`;
		console.log(colors.bold.green(`Done with ${name}`));
	}

	const packages_readme_node = remark().parse(packages_readme_text);
	let target_node_index = 0;
	for (let index = 0; index < parsed_root_readme_md.children.length; index++) {
		const node = parsed_root_readme_md.children[index];
		if (
			node.type === 'heading' &&
			node.children[0].value === 'Packages' &&
			parsed_root_readme_md.children[index + 1].type === 'list'
		) {
			target_node_index = index + 1;
			break;
		}
	}
	parsed_root_readme_md.children[target_node_index] = packages_readme_node;
	parsed_root_readme_md.children[5] = remark().parse(dedent`
  <p align="center">
    <img src="https://img.shields.io/badge/Total%20Packages-${packages_data.length}-%2371368a">
    <img src="https://img.shields.io/badge/Published%20Packages-${total_published_packages}-%2311806a">
  </p>`);
	await fs.promises.writeFile(root_readme_path, remark().stringify(parsed_root_readme_md), 'utf-8');
}
