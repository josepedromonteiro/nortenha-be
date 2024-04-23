import { Injectable } from '@nestjs/common';
import WooCommerceRestApi, {
  WooCommerceRestApiMethod,
} from '@woocommerce/woocommerce-rest-api';
import { ConfigService } from '@nestjs/config';
import { Method } from 'axios';
import { VendusRequestParams } from '../vendus/vendus.service';
import { pathExists } from 'fs-extra';
import { Client } from 'basic-ftp';
import * as spawnAsync from '@expo/spawn-async';

export interface WoocommerceRequestParams {
  url: string;
  // baseUrl?: string;
  // apiVersion?: string;
  method: Method;
  data?: any;
  params?: { [key: string]: any };
  // pagination?: Pagination;
}

@Injectable()
export class WoocommerceService {
  constructor(private readonly config: ConfigService) {}

  instance: WooCommerceRestApi = new WooCommerceRestApi({
    url: this.config.get('WOO_URL'),
    consumerKey: this.config.get('WOO_CONSUMER_KEY'),
    consumerSecret: this.config.get('WOO_CONSUMER_SECRET'),
    version: 'wc/v3',
  });

  public request = (params: VendusRequestParams) => {
    // console.log({
    //   method: params.method,
    //   url: `${params.baseUrl ? `${params.baseUrl}/${params.apiVersion ? `${params.apiVersion}/` : ''}` : `${VENDUS_BASE_URL}/`}${params.url}`,
    //   data: params.data,
    //   params: {
    //     api_key: VENDUS_API_KEY,
    //     per_page: params?.pagination?.elementsPerPage,
    //     page: params?.pagination?.pageNumber,
    //     ...params.params,
    //   },
    // });
    // console.log(this.instance._request());
    console.log(this.instance);
    const req = this.instance._request(
      params.method.toLowerCase() as WooCommerceRestApiMethod,
      params.url,
      params.data,
      params.params,
    );

    console.log(this.instance._getOAuth());

    return req;
  };

  async repoExists(destinationPath: string): Promise<boolean> {
    try {
      const files = await pathExists(destinationPath);
      return files;
    } catch (error) {
      console.error('Error checking directory content:', error);
      return false;
    }
  }

  // Function to clone the git repository
  async cloneRepo(repoUrl: string, destinationPath: string) {
    try {
      const exists = await this.repoExists(destinationPath);
      if (!exists) {
        await spawnAsync('git', ['clone', repoUrl, destinationPath]);
      } else {
        await spawnAsync('git', ['fetch', destinationPath]);
      }

      console.log(`Repository ${exists ? 'fetched' : 'cloned'} successfully.`);
    } catch (error) {
      console.error('Error cloning repository:', error);
    }
  }

  // Function to install npm dependencies
  async installDependencies(directory: string) {
    console.log('Start npm dependencies installation');
    try {
      process.chdir(directory);
      const process_ = spawnAsync('npm', ['install']);
      process_.child.on('data', (data) => {
        console.log('npm stdout:', new TextDecoder().decode(data));
      });
      process_.child.stderr.on('data', (data) => {
        console.error('!!!!!npm ERROR!!!!!1:', new TextDecoder().decode(data));
      });
      await process_;
      console.log('Dependencies installed successfully.');
    } catch (error) {
      console.error('Error installing dependencies:', error);
    }
  }

  // Function to run an npm command
  async runNpmCommand(directory: string, command: string) {
    try {
      // process.chdir(directory);
      await spawnAsync('npm', ['run', 'generate']);
      console.log(`npm ${command} command executed successfully.`);
    } catch (error) {
      console.error(`Error running npm ${command} command:`, error);
    }
  }

  // Function to deploy directory to FTP server
  async deployToFTP(directory: string) {
    const client = new Client();
    try {
      await client.access({
        host: this.config.get('FTP_HOST'),
        user: this.config.get('FTP_USERNAME'),
        password: this.config.get('FTP_PASSWORD'),
      });
      await client.cd('domains/companhianortenha.com/public_html/app');
      await client.clearWorkingDir();
      await client.uploadFromDir(directory);
      console.log('Directory deployed to FTP server successfully.');
    } catch (error) {
      console.error('Error deploying directory to FTP server:', error);
    } finally {
      await client.close();
    }
  }

  public async redeployWebsite() {
    // Define the repository URL, destination directory, and npm command
    const github_access_token = this.config.get('GITHUB_TOKEN');
    const repoUrl = `https://${github_access_token}@github.com/josepedromonteiro/mercearia-nortenha-nuxt.git`;
    const destinationPath = './repo';
    const npmCommand = 'generate'; // Change this to the desired npm command

    try {
      // Clone the repository
      await this.cloneRepo(repoUrl, destinationPath);

      // Install npm dependencies
      await this.installDependencies(destinationPath);

      // Run an npm command
      await this.runNpmCommand(destinationPath, npmCommand);
    } catch (e) {
      console.error(e);
      return;
    }

    await this.deployToFTP(`${destinationPath}/.output/public`);
  }
}
