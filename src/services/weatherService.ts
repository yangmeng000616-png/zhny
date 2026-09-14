import dataService from './dataService';
import type { WeatherNowcastData, RadarEchoFrame, AgroRiskWarning, DeviceLinkageAction } from '../types/digitalTwin';

class WeatherService {
  async getNowcast(): Promise<WeatherNowcastData> {
    return dataService.getWeatherNowcast();
  }

  async getCurrentNowcast() {
    const data = await this.getNowcast();
    return data.currentObservation;
  }

  async getMinutelyNowcast() {
    const data = await this.getNowcast();
    return data.timeline;
  }

  async getRadarFrames(): Promise<RadarEchoFrame[]> {
    return dataService.getWeatherRadar();
  }

  async getRadarEchoFrames(): Promise<RadarEchoFrame[]> {
    return this.getRadarFrames();
  }

  async getAgroRiskAlerts(): Promise<AgroRiskWarning[]> {
    return dataService.getAgroRiskAlerts();
  }

  async getRiskWarnings(): Promise<AgroRiskWarning[]> {
    return this.getAgroRiskAlerts();
  }

  async mitigateRiskWarning(warningId: string): Promise<boolean> {
    const alerts = await this.getAgroRiskAlerts();
    const found = alerts.find((a) => a.id === warningId);
    if (found && found.linkageActions && found.linkageActions.length > 0) {
      await this.executeLinkageStrategy(found.linkageActions);
    }
    found && (found.isMitigated = true);
    return true;
  }

  async executeLinkageStrategy(actions: DeviceLinkageAction[]): Promise<boolean> {
    return dataService.executeDeviceLinkage(actions);
  }
}

export const weatherService = new WeatherService();
export default weatherService;
