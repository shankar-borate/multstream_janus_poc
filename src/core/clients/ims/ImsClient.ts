// import { HttpClient } from "../../http/HttpClient";
// import type { ImsSettingRow, MediaConstraintsPayload } from "./ims.types";

class ImsClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * GET /ims/users/media-constraints
   * Returns row with a JSON string in `value`. We parse it and return the payload.
   */
  async getMediaConstraints(): Promise<MediaConstraintsPayload> {
    const res = await this.http.getJson<ImsSettingRow>("/ims/users/media-constraints");
    const row = res.data;

    // value is a JSON string (escaped)
    const payload: MediaConstraintsPayload = JSON.parse(row.value);
    return payload;
  }
}
