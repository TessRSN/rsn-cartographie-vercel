import { NextDrupal } from "next-drupal";

export const API_ENDPOINT = "https://catalog.paradim.science";
export const drupal = new NextDrupal(API_ENDPOINT);
